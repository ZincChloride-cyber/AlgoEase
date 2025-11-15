# Terraform configuration for PolyOne infrastructure
# Supports AWS and GCP deployments

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

# Provider configuration
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "PolyOne"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

provider "docker" {
  host = "unix:///var/run/docker.sock"
}

# Variables
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "chain_id" {
  description = "Unique chain identifier"
  type        = string
}

variable "chain_name" {
  description = "Chain name"
  type        = string
}

variable "validators_count" {
  description = "Number of validator nodes"
  type        = number
  default     = 3
}

variable "instance_type" {
  description = "EC2 instance type for nodes"
  type        = string
  default     = "t3.medium"
}

# VPC Configuration
resource "aws_vpc" "polyone_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "polyone-${var.chain_id}-vpc"
  }
}

resource "aws_internet_gateway" "polyone_igw" {
  vpc_id = aws_vpc.polyone_vpc.id

  tags = {
    Name = "polyone-${var.chain_id}-igw"
  }
}

# Subnets
resource "aws_subnet" "polyone_public" {
  vpc_id                  = aws_vpc.polyone_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "polyone-${var.chain_id}-public-subnet"
  }
}

resource "aws_route_table" "polyone_public_rt" {
  vpc_id = aws_vpc.polyone_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.polyone_igw.id
  }

  tags = {
    Name = "polyone-${var.chain_id}-public-rt"
  }
}

resource "aws_route_table_association" "polyone_public_rta" {
  subnet_id      = aws_subnet.polyone_public.id
  route_table_id = aws_route_table.polyone_public_rt.id
}

# Security Group
resource "aws_security_group" "polyone_sg" {
  name        = "polyone-${var.chain_id}-sg"
  description = "Security group for PolyOne chain nodes"
  vpc_id      = aws_vpc.polyone_vpc.id

  ingress {
    description = "RPC Port"
    from_port   = 8545
    to_port     = 8546
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "polyone-${var.chain_id}-sg"
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "polyone_node_role" {
  name = "polyone-${var.chain_id}-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_instance_profile" "polyone_node_profile" {
  name = "polyone-${var.chain_id}-node-profile"
  role = aws_iam_role.polyone_node_role.name
}

# User data script for node initialization
locals {
  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y docker git
              systemctl start docker
              systemctl enable docker
              usermod -a -G docker ec2-user
              
              # Install Docker Compose
              curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
              chmod +x /usr/local/bin/docker-compose
              
              # Create chain directory
              mkdir -p /opt/polyone/${var.chain_id}
              
              # The actual chain deployment will be handled by the backend service
              EOF
}

# EC2 Instance for Sequencer
resource "aws_instance" "sequencer" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.polyone_public.id
  vpc_security_group_ids = [aws_security_group.polyone_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.polyone_node_profile.name
  user_data              = base64encode(local.user_data)

  root_block_device {
    volume_type = "gp3"
    volume_size = 50
  }

  tags = {
    Name = "polyone-${var.chain_id}-sequencer"
    Type = "sequencer"
  }
}

# EC2 Instances for Validators
resource "aws_instance" "validators" {
  count                  = var.validators_count
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.polyone_public.id
  vpc_security_group_ids = [aws_security_group.polyone_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.polyone_node_profile.name
  user_data              = base64encode(local.user_data)

  root_block_device {
    volume_type = "gp3"
    volume_size = 50
  }

  tags = {
    Name = "polyone-${var.chain_id}-validator-${count.index + 1}"
    Type = "validator"
  }
}

# Data source for Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Elastic IP for Sequencer
resource "aws_eip" "sequencer_eip" {
  instance = aws_instance.sequencer.id
  domain   = "vpc"

  tags = {
    Name = "polyone-${var.chain_id}-sequencer-eip"
  }
}

# Outputs
output "sequencer_public_ip" {
  description = "Public IP of the sequencer node"
  value       = aws_eip.sequencer_eip.public_ip
}

output "validator_public_ips" {
  description = "Public IPs of validator nodes"
  value       = aws_instance.validators[*].public_ip
}

output "sequencer_rpc_url" {
  description = "RPC URL for the sequencer"
  value       = "http://${aws_eip.sequencer_eip.public_ip}:8545"
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.polyone_vpc.id
}

