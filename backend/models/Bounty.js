const { getSupabase } = require('../config/database');

/**
 * Bounty Model - Handles all database operations for bounties
 * Supports both camelCase (API) and snake_case (database) field names
 */
class Bounty {
  constructor(data) {
    this.id = data.id;
    
    // CRITICAL: Handle both contract_id and contractId properly
    // Check contract_id first (from database), then contractId (from API)
    let contractIdValue = null;
    if (data.contract_id !== undefined) {
      contractIdValue = data.contract_id;
    } else if (data.contractId !== undefined) {
      contractIdValue = data.contractId;
    }
    
    // Convert to number if it's a string, validate it's numeric
    if (contractIdValue !== null && contractIdValue !== undefined && contractIdValue !== '') {
      const contractIdNum = typeof contractIdValue === 'string' ? parseInt(contractIdValue, 10) : contractIdValue;
      this.contract_id = (!isNaN(contractIdNum) && isFinite(contractIdNum) && contractIdNum >= 0) ? contractIdNum : null;
      this.contractId = this.contract_id;
    } else {
      this.contract_id = null;
      this.contractId = null;
    }
    
    // Address fields (support both formats)
    this.client_address = data.client_address || data.clientAddress;
    this.clientAddress = this.client_address;
    this.freelancer_address = data.freelancer_address || data.freelancerAddress;
    this.freelancerAddress = this.freelancer_address;
    this.verifier_address = data.verifier_address || data.verifierAddress;
    this.verifierAddress = this.verifier_address;
    
    // Core fields
    this.amount = data.amount;
    this.deadline = data.deadline;
    this.status = data.status || 'open';
    this.title = data.title;
    this.description = data.description;
    this.requirements = data.requirements || [];
    this.tags = data.tags || [];
    this.submissions = data.submissions || [];
    
    // Timestamps
    this.created_at = data.created_at || data.createdAt;
    this.updated_at = data.updated_at || data.updatedAt;
    
    // Transaction IDs for tracking on-chain transactions
    this.create_transaction_id = data.create_transaction_id || data.createTransactionId || data.transactionId;
    this.createTransactionId = this.create_transaction_id;
    this.accept_transaction_id = data.accept_transaction_id || data.acceptTransactionId;
    this.acceptTransactionId = this.accept_transaction_id;
    this.submit_transaction_id = data.submit_transaction_id || data.submitTransactionId;
    this.submitTransactionId = this.submit_transaction_id;
    this.approve_transaction_id = data.approve_transaction_id || data.approveTransactionId;
    this.approveTransactionId = this.approve_transaction_id;
    this.reject_transaction_id = data.reject_transaction_id || data.rejectTransactionId;
    this.rejectTransactionId = this.reject_transaction_id;
    this.claim_transaction_id = data.claim_transaction_id || data.claimTransactionId;
    this.claimTransactionId = this.claim_transaction_id;
    this.refund_transaction_id = data.refund_transaction_id || data.refundTransactionId;
    this.refundTransactionId = this.refund_transaction_id;
  }

  /**
   * Convert to object with camelCase for API responses
   * New contract: deadline and verifierAddress are optional (null)
   * CRITICAL: Includes both contractId (camelCase) and contract_id (snake_case) for consistency
   */
  toObject() {
    // Ensure contract_id is properly set (use contractId as fallback if contract_id is missing)
    const contractIdValue = this.contract_id !== undefined && this.contract_id !== null 
      ? this.contract_id 
      : (this.contractId !== undefined && this.contractId !== null ? this.contractId : null);
    
    return {
      id: this.id,
      // Include both formats for consistency
      contractId: contractIdValue,
      contract_id: contractIdValue,
      clientAddress: this.client_address,
      client_address: this.client_address, // Include snake_case for consistency
      freelancerAddress: this.freelancer_address,
      freelancer_address: this.freelancer_address, // Include snake_case for consistency
      verifierAddress: this.verifier_address || null, // Always null for new contract (creator only)
      verifier_address: this.verifier_address || null, // Include snake_case for consistency
      amount: parseFloat(this.amount),
      deadline: this.deadline || null, // Optional - not used by new contract
      status: this.status,
      title: this.title,
      description: this.description,
      requirements: this.requirements || [],
      tags: this.tags || [],
      submissions: this.submissions || [],
      createdAt: this.created_at,
      created_at: this.created_at, // Include snake_case for consistency
      updatedAt: this.updated_at,
      updated_at: this.updated_at, // Include snake_case for consistency
      createTransactionId: this.create_transaction_id || this.createTransactionId || this.transactionId || null,
      create_transaction_id: this.create_transaction_id || this.createTransactionId || this.transactionId || null,
      acceptTransactionId: this.accept_transaction_id || this.acceptTransactionId || null,
      accept_transaction_id: this.accept_transaction_id || this.acceptTransactionId || null,
      submitTransactionId: this.submit_transaction_id || this.submitTransactionId || null,
      submit_transaction_id: this.submit_transaction_id || this.submitTransactionId || null,
      approveTransactionId: this.approve_transaction_id || this.approveTransactionId || null,
      approve_transaction_id: this.approve_transaction_id || this.approveTransactionId || null,
      rejectTransactionId: this.reject_transaction_id || this.rejectTransactionId || null,
      reject_transaction_id: this.reject_transaction_id || this.rejectTransactionId || null,
      claimTransactionId: this.claim_transaction_id || this.claimTransactionId || null,
      claim_transaction_id: this.claim_transaction_id || this.claimTransactionId || null,
      refundTransactionId: this.refund_transaction_id || this.refundTransactionId || null,
      refund_transaction_id: this.refund_transaction_id || this.refundTransactionId || null
    };
  }

  /**
   * Convert to database format (snake_case)
   * CRITICAL: Always includes contract_id - never omit it
   */
  toDBFormat() {
    const dbData = {
      client_address: this.client_address || this.clientAddress || null,
      freelancer_address: this.freelancer_address || this.freelancerAddress || null,
      verifier_address: null, // New contract doesn't use verifier - always null (creator only)
      amount: this.amount ? parseFloat(this.amount) : null,
      deadline: this.deadline ? (this.deadline instanceof Date ? this.deadline.toISOString() : new Date(this.deadline).toISOString()) : null, // Optional - not used by new contract
      status: this.status || 'open',
      title: this.title || null,
      description: this.description || null,
      requirements: Array.isArray(this.requirements) ? this.requirements : (this.requirements ? [this.requirements] : []),
      tags: Array.isArray(this.tags) ? this.tags : (this.tags ? [this.tags] : []),
      submissions: Array.isArray(this.submissions) ? this.submissions : [],
      create_transaction_id: this.create_transaction_id || this.createTransactionId || this.transactionId || null,
      accept_transaction_id: this.accept_transaction_id || this.acceptTransactionId || null,
      submit_transaction_id: this.submit_transaction_id || this.submitTransactionId || null,
      approve_transaction_id: this.approve_transaction_id || this.approveTransactionId || null,
      reject_transaction_id: this.reject_transaction_id || this.rejectTransactionId || null,
      claim_transaction_id: this.claim_transaction_id || this.claimTransactionId || null,
      refund_transaction_id: this.refund_transaction_id || this.refundTransactionId || null
    };
    
    // CRITICAL: ALWAYS include contract_id in dbData, even if it's null
    // This ensures Supabase will save it properly
    if (this.contract_id !== undefined && this.contract_id !== null && this.contract_id !== '') {
      // Has a value - validate and convert to number
      const contractIdNum = typeof this.contract_id === 'string' ? parseInt(this.contract_id, 10) : this.contract_id;
      if (!isNaN(contractIdNum) && isFinite(contractIdNum) && contractIdNum >= 0) {
        dbData.contract_id = contractIdNum;
        console.log('💾 toDBFormat: Setting contract_id to:', contractIdNum, '(type:', typeof contractIdNum, ')');
      } else {
        dbData.contract_id = null;
        console.warn('⚠️ toDBFormat: Invalid contract_id value, setting to null:', this.contract_id);
      }
    } else {
      // Explicitly set to null (don't omit the field)
      dbData.contract_id = null;
      console.log('💾 toDBFormat: Setting contract_id to null (explicit)');
    }
    
    // Remove undefined values (but keep null values - they're important!)
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) {
        delete dbData[key];
      }
      // Convert empty strings to null for transaction IDs
      if (key.includes('transaction_id') && dbData[key] === '') {
        dbData[key] = null;
      }
    });
    
    // Log what we're sending to database
    console.log('💾 toDBFormat result - contract_id:', dbData.contract_id, '(included:', 'contract_id' in dbData, ')');
    
    return dbData;
  }

  // ============================================================================
  // Static Methods - Database Operations
  // ============================================================================

  /**
   * Find bounties with filters
   */
  static async find(filter = {}, options = {}) {
    const supabase = getSupabase();
    let selectFields = options.select || '*';
    
    // Handle field exclusion (e.g., '-submissions')
    if (options.select && options.select.startsWith('-')) {
      selectFields = '*';
    }
    
    let query = supabase.from('bounties').select(selectFields);

    // Apply filters
    if (filter.contractId) {
      const contractIdNum = typeof filter.contractId === 'string' ? parseInt(filter.contractId, 10) : filter.contractId;
      if (!isNaN(contractIdNum) && isFinite(contractIdNum)) {
        query = query.eq('contract_id', contractIdNum);
      } else {
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

    // Apply sorting
    if (options.sort) {
      const sortField = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortField] === -1 ? 'desc' : 'asc';
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
    
    if (!data || data.length === 0) {
      return [];
    }
    
    let results = data.map(row => new Bounty(row));
    
    // Handle field exclusion in post-processing
    if (options.select && options.select.startsWith('-')) {
      const excludeField = options.select.substring(1);
      const excludeFieldSnake = excludeField.replace(/([A-Z])/g, '_$1').toLowerCase();
      results = results.map(bounty => {
        const obj = bounty.toObject();
        delete obj[excludeField];
        delete obj[excludeFieldSnake];
        return {
          ...obj,
          toObject: () => obj
        };
      });
    }
    
    return results;
  }

  /**
   * Find one bounty
   */
  static async findOne(filter, options = {}) {
    const results = await this.find(filter, { ...options, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find by ID
   */
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

  /**
   * Count documents
   */
  static async countDocuments(filter = {}) {
    const supabase = getSupabase();
    let query = supabase.from('bounties').select('*', { count: 'exact', head: true });
    
    // Apply same filters as find() method
    if (filter.contractId) {
      const contractIdNum = typeof filter.contractId === 'string' ? parseInt(filter.contractId, 10) : filter.contractId;
      if (!isNaN(contractIdNum) && isFinite(contractIdNum)) {
        query = query.eq('contract_id', contractIdNum);
      } else {
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

  /**
   * Save bounty (insert or update)
   */
  async save() {
    const supabase = getSupabase();
    const dbData = this.toDBFormat();

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

    // CRITICAL: Log contract_id before save
    console.log('💾 Bounty.save() - Before save:', {
      id: this.id,
      contract_id: this.contract_id,
      contractId: this.contractId,
      dbData_contract_id: dbData.contract_id,
      has_contract_id_in_dbData: 'contract_id' in dbData
    });

    if (this.id) {
      // Update existing
      console.log('💾 Updating existing bounty:', this.id);
      const { data, error } = await supabase
        .from('bounties')
        .update(dbData)
        .eq('id', this.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating bounty:', error);
        console.error('❌ Update data:', JSON.stringify(dbData, null, 2));
        throw error;
      }
      
      if (data) {
        console.log('✅ Bounty updated. Saved contract_id:', data.contract_id);
        Object.assign(this, new Bounty(data));
      }
    } else {
      // Insert new
      const insertData = { ...dbData };
      delete insertData.id; // Let database generate UUID
      
      console.log('💾 Inserting new bounty with contract_id:', insertData.contract_id);
      console.log('💾 Insert data keys:', Object.keys(insertData));
      
      const { data, error } = await supabase
        .from('bounties')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting bounty:', error);
        console.error('❌ Insert data:', JSON.stringify(insertData, null, 2));
        throw error;
      }
      
      if (data) {
        console.log('✅ Bounty inserted successfully!');
        console.log('✅ Inserted bounty ID:', data.id);
        console.log('✅ Inserted bounty contract_id:', data.contract_id);
        console.log('✅ Inserted bounty title:', data.title);
        
        const savedData = new Bounty(data);
        Object.assign(this, savedData);
        
        // CRITICAL: Verify we have an ID
        if (!this.id || !data.id) {
          console.error('❌ CRITICAL: Bounty inserted but missing ID!');
          console.error('❌ Insert data returned:', data);
          throw new Error('Bounty insert failed - no ID returned from database');
        }
        
        // Verify contract_id was saved
        if (insertData.contract_id !== null && data.contract_id === null) {
          console.error('❌ CRITICAL: contract_id was NOT saved! Expected:', insertData.contract_id, 'Got:', data.contract_id);
        }
      } else {
        console.error('❌ CRITICAL: Insert operation returned no data!');
        console.error('❌ Insert data sent:', insertData);
        throw new Error('Insert operation returned no data - bounty may not have been saved');
      }
    }
    return this;
  }

  /**
   * Find by ID and update
   */
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
