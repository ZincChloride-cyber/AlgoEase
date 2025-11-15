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

output "subnet_id" {
  description = "Public subnet ID"
  value       = aws_subnet.polyone_public.id
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.polyone_sg.id
}

