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
      updatedAt: this.updated_at
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
      submissions: Array.isArray(this.submissions) ? this.submissions : []
    };
    
    // Only include contract_id if it's not null/undefined/empty string
    if (this.contract_id !== null && this.contract_id !== undefined && this.contract_id !== '') {
      dbData.contract_id = this.contract_id;
    }
    
    // Remove undefined values
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) {
        delete dbData[key];
      }
    });
    
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
      query = query.eq('contract_id', filter.contractId);
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
      query = query.eq('contract_id', filter.contractId);
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
        Object.assign(this, new Bounty(data));
        console.log('✅ Bounty inserted successfully:', this.id, 'Contract ID:', this.contract_id);
      } else {
        console.error('❌ Insert returned no data');
        throw new Error('Insert operation returned no data');
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
