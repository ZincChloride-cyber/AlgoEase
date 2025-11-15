const { getSupabase } = require('../config/database');

class Bounty {
  constructor(data) {
    this.id = data.id;
    this.contract_id = data.contract_id || data.contractId;
    this.client_address = data.client_address || data.clientAddress;
    this.freelancer_address = data.freelancer_address || data.freelancerAddress;
    this.verifier_address = data.verifier_address || data.verifierAddress;
    this.amount = data.amount;
    this.deadline = data.deadline;
    this.status = data.status || 'open';
    this.title = data.title;
    this.description = data.description;
    this.requirements = data.requirements || [];
    this.tags = data.tags || [];
    this.submissions = data.submissions || [];
    this.created_at = data.created_at || data.createdAt;
    this.updated_at = data.updated_at || data.updatedAt;
    // Transaction IDs for tracking on-chain transactions
    this.create_transaction_id = data.create_transaction_id || data.createTransactionId || data.transactionId;
    this.accept_transaction_id = data.accept_transaction_id || data.acceptTransactionId;
    this.approve_transaction_id = data.approve_transaction_id || data.approveTransactionId;
    this.reject_transaction_id = data.reject_transaction_id || data.rejectTransactionId;
    this.claim_transaction_id = data.claim_transaction_id || data.claimTransactionId;
    this.refund_transaction_id = data.refund_transaction_id || data.refundTransactionId;
  }

  // Convert to object with camelCase for API responses
  toObject() {
    return {
      id: this.id,
      contractId: this.contract_id,
      clientAddress: this.client_address,
      freelancerAddress: this.freelancer_address,
      verifierAddress: this.verifier_address,
      amount: parseFloat(this.amount),
      deadline: this.deadline,
      status: this.status,
      title: this.title,
      description: this.description,
      requirements: this.requirements,
      tags: this.tags,
      submissions: this.submissions,
      createdAt: this.created_at,
      updatedAt: this.updated_at,
      createTransactionId: this.create_transaction_id,
      acceptTransactionId: this.accept_transaction_id,
      approveTransactionId: this.approve_transaction_id,
      rejectTransactionId: this.reject_transaction_id,
      claimTransactionId: this.claim_transaction_id,
      refundTransactionId: this.refund_transaction_id
    };
  }

  // Convert to database format (snake_case)
  toDBFormat() {
    const dbData = {
      client_address: this.client_address,
      freelancer_address: this.freelancer_address || null,
      verifier_address: this.verifier_address || null,
      amount: this.amount,
      deadline: this.deadline ? new Date(this.deadline).toISOString() : null,
      status: this.status || 'open',
      title: this.title,
      description: this.description,
      requirements: Array.isArray(this.requirements) ? this.requirements : [],
      tags: Array.isArray(this.tags) ? this.tags : [],
      submissions: Array.isArray(this.submissions) ? this.submissions : [],
      create_transaction_id: this.create_transaction_id || null,
      accept_transaction_id: this.accept_transaction_id || null,
      approve_transaction_id: this.approve_transaction_id || null,
      reject_transaction_id: this.reject_transaction_id || null,
      claim_transaction_id: this.claim_transaction_id || null,
      refund_transaction_id: this.refund_transaction_id || null
    };
    
    // Only include contract_id if it's not null/undefined/empty string AND is a valid number
    if (this.contract_id !== null && this.contract_id !== undefined && this.contract_id !== '') {
      // Validate that contract_id is numeric (bigint in database)
      const contractIdNum = typeof this.contract_id === 'string' ? parseInt(this.contract_id, 10) : this.contract_id;
      if (!isNaN(contractIdNum) && isFinite(contractIdNum) && contractIdNum >= 0) {
        dbData.contract_id = contractIdNum;
      } else {
        console.error('❌ Invalid contract_id value:', this.contract_id, '(expected numeric)');
        // Don't include invalid contract_id - it will cause database errors
        // This prevents addresses or other strings from being saved as contract_id
      }
    }
    
    // Remove undefined values and empty strings (convert to null for transaction IDs)
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) {
        delete dbData[key];
      }
      // Convert empty strings to null for transaction IDs
      if (key.includes('transaction_id') && dbData[key] === '') {
        dbData[key] = null;
      }
    });
    
    // Log transaction IDs being saved
    if (this.create_transaction_id || this.accept_transaction_id || this.approve_transaction_id || this.reject_transaction_id || 
        this.claim_transaction_id || this.refund_transaction_id) {
      console.log('💾 Transaction IDs in toDBFormat:', {
        create: this.create_transaction_id,
        accept: this.accept_transaction_id,
        approve: this.approve_transaction_id,
        reject: this.reject_transaction_id,
        claim: this.claim_transaction_id,
        refund: this.refund_transaction_id
      });
    }
    
    return dbData;
  }

  // Static methods for database operations
  static async find(filter = {}, options = {}) {
    const supabase = getSupabase();
    let selectFields = options.select || '*';
    
    // Handle field exclusion (e.g., '-submissions')
    if (options.select && options.select.startsWith('-')) {
      const excludeField = options.select.substring(1);
      // For simplicity, we'll select all fields and remove the excluded one in post-processing
      selectFields = '*';
    }
    
    let query = supabase.from('bounties').select(selectFields);

    // Apply filters
    if (filter.contractId) {
      // Validate contractId is numeric before querying (contract_id is bigint in database)
      const contractIdNum = typeof filter.contractId === 'string' ? parseInt(filter.contractId, 10) : filter.contractId;
      if (!isNaN(contractIdNum) && isFinite(contractIdNum)) {
        query = query.eq('contract_id', contractIdNum);
      } else {
        console.warn('⚠️ Invalid contractId in filter (not numeric):', filter.contractId);
        // Return empty results if contractId is invalid
        return [];
      }
    }
    if (filter.clientAddress) {
      query = query.eq('client_address', filter.clientAddress);
    }
    if (filter.freelancerAddress) {
      query = query.eq('freelancer_address', filter.freelancerAddress);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.amount) {
      if (filter.amount.$gte) {
        query = query.gte('amount', filter.amount.$gte);
      }
      if (filter.amount.$lte) {
        query = query.lte('amount', filter.amount.$lte);
      }
    }
    if (filter.deadline) {
      if (filter.deadline.$gte) {
        query = query.gte('deadline', filter.deadline.$gte);
      }
    }
    if (filter.$or) {
      // Handle OR conditions - Supabase uses .or() with a different syntax
      const orConditions = filter.$or;
      const conditions = orConditions.map(cond => {
        if (cond.clientAddress) {
          return `client_address.eq.${cond.clientAddress}`;
        }
        if (cond.freelancerAddress) {
          return `freelancer_address.eq.${cond.freelancerAddress}`;
        }
        return null;
      }).filter(Boolean);
      
      if (conditions.length > 0) {
        // Supabase .or() syntax: "field1.eq.value1,field2.eq.value2"
        query = query.or(conditions.join(','));
      }
    }

    // Apply sorting
    if (options.sort) {
      const sortField = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortField] === -1 ? 'desc' : 'asc';
      // Use the field as-is (should already be in snake_case from routes)
      query = query.order(sortField, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    if (options.skip) {
      query = query.range(options.skip, options.skip + (options.limit || 10) - 1);
    } else if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Supabase query error:', error);
      throw error;
    }
    
    // Handle empty results
    if (!data || data.length === 0) {
      console.log('📭 No bounties found with filter:', filter);
      return [];
    }
    
    let results = data.map(row => new Bounty(row));
    
    // Handle field exclusion in post-processing
    if (options.select && options.select.startsWith('-')) {
      const excludeField = options.select.substring(1);
      // Map camelCase to snake_case for exclusion
      const excludeFieldSnake = excludeField.replace(/([A-Z])/g, '_$1').toLowerCase();
      results = results.map(bounty => {
        const obj = bounty.toObject();
        // Remove both camelCase and snake_case versions
        delete obj[excludeField];
        delete obj[excludeFieldSnake];
        // Return a Bounty-like object that has toObject method
        return {
          ...obj,
          toObject: () => obj
        };
      });
    }
    
    console.log(`✅ Found ${results.length} bounties`);
    return results;
  }

  static _camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  static async findOne(filter, options = {}) {
    const results = await this.find(filter, { ...options, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  static async findById(id) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('bounties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data ? new Bounty(data) : null;
  }

  static async countDocuments(filter = {}) {
    const supabase = getSupabase();
    let query = supabase.from('bounties').select('*', { count: 'exact', head: true });
    
    // Apply same filters as find() method
    if (filter.contractId) {
      // Validate contractId is numeric before querying (contract_id is bigint in database)
      const contractIdNum = typeof filter.contractId === 'string' ? parseInt(filter.contractId, 10) : filter.contractId;
      if (!isNaN(contractIdNum) && isFinite(contractIdNum)) {
        query = query.eq('contract_id', contractIdNum);
      } else {
        console.warn('⚠️ Invalid contractId in filter (not numeric):', filter.contractId);
        // Return 0 count if contractId is invalid
        return 0;
      }
    }
    if (filter.clientAddress) {
      query = query.eq('client_address', filter.clientAddress);
    }
    if (filter.freelancerAddress) {
      query = query.eq('freelancer_address', filter.freelancerAddress);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.amount) {
      if (filter.amount.$gte) {
        query = query.gte('amount', filter.amount.$gte);
      }
      if (filter.amount.$lte) {
        query = query.lte('amount', filter.amount.$lte);
      }
    }
    if (filter.deadline) {
      if (filter.deadline.$gte) {
        query = query.gte('deadline', filter.deadline.$gte);
      }
    }
    if (filter.$or) {
      const orConditions = filter.$or;
      const conditions = orConditions.map(cond => {
        if (cond.clientAddress) {
          return `client_address.eq.${cond.clientAddress}`;
        }
        if (cond.freelancerAddress) {
          return `freelancer_address.eq.${cond.freelancerAddress}`;
        }
        return null;
      }).filter(Boolean);
      
      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      }
    }
    
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  async save() {
    const supabase = getSupabase();
    const dbData = this.toDBFormat();

    console.log('💾 Saving bounty to database:', {
      id: this.id,
      contract_id: this.contract_id,
      dbData: JSON.stringify(dbData, null, 2)
    });

    // Ensure JSONB fields are properly formatted
    if (dbData.requirements && !Array.isArray(dbData.requirements)) {
      dbData.requirements = [];
    }
    if (dbData.tags && !Array.isArray(dbData.tags)) {
      dbData.tags = [];
    }
    if (dbData.submissions && !Array.isArray(dbData.submissions)) {
      dbData.submissions = [];
    }

    if (this.id) {
      // Update existing - find by database id first
      // Log what we're trying to update
      console.log('💾 Updating bounty with ID:', this.id);
      console.log('💾 Update data keys:', Object.keys(dbData));
      if (dbData.accept_transaction_id || dbData.approve_transaction_id || dbData.reject_transaction_id ||
          dbData.claim_transaction_id || dbData.refund_transaction_id) {
        console.log('💾 Transaction IDs in update:', {
          accept: dbData.accept_transaction_id,
          approve: dbData.approve_transaction_id,
          reject: dbData.reject_transaction_id,
          claim: dbData.claim_transaction_id,
          refund: dbData.refund_transaction_id
        });
      }
      
      const { data, error } = await supabase
        .from('bounties')
        .update(dbData)
        .eq('id', this.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating bounty:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        console.error('❌ Data being updated:', JSON.stringify(dbData, null, 2));
        throw error;
      }
      
      if (data) {
        // Update instance with saved data
        Object.assign(this, new Bounty(data));
        console.log('✅ Bounty updated successfully:', this.id);
      } else {
        console.warn('⚠️ Update returned no data');
      }
    } else {
      // Insert new - ensure we don't include id in insert
      const insertData = { ...dbData };
      delete insertData.id; // Let database generate UUID
      
      console.log('📝 Inserting new bounty with data:', JSON.stringify(insertData, null, 2));
      
      const { data, error } = await supabase
        .from('bounties')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting bounty:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          insertData: JSON.stringify(insertData, null, 2)
        });
        throw error;
      }
      
      if (data) {
        // Update instance with saved data
        const savedData = new Bounty(data);
        Object.assign(this, savedData);
        console.log('✅ Bounty inserted successfully!');
        console.log('✅ Database ID:', this.id);
        console.log('✅ Contract ID:', this.contract_id);
        console.log('✅ Full saved data:', JSON.stringify(data, null, 2));
      } else {
        console.error('❌ Insert returned no data');
        console.error('❌ Insert data sent:', JSON.stringify(insertData, null, 2));
        throw new Error('Insert operation returned no data - check database connection and table structure');
      }
    }
    return this;
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('bounties')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data ? new Bounty(data) : null;
  }
}

module.exports = Bounty;
