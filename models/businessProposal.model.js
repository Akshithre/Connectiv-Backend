const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const documentSchema = new Schema({
  type: { type: String, required: true },
  file: { type: String, required: true }
});
const proposalDocumentSchema = new Schema({
  type: { type: String, required: true },
  file: { type: String, required: true }
});
const imageSchema = new Schema({
  type: String,
  file: String
});

const marketTotalValueSchema = new Schema({
  amount: Number,
  currency: String,
  scale: String
});
const dcfValuationSchema = new Schema({
  revenue: { type: Map, of: String },
  ebitda: { type: Map, of: String },
  capex: { type: Map, of: String },
  wcap_days: { type: Map, of: String },
  perpetualGrowthRate: String,
  wcap: String,
  grossDebt: String,
  valuation: String,
  rating: String,
  capitalEmployed: String
});

const ebitdaValuationSchema = new Schema({
  revenue: { type: Map, of: String },
  ebitda: { type: Map, of: String },
  grossDebt: String,
  valuation: String,
  rating: String,
  capitalEmployed: String
});

// New schemas for different proposal types
const equityFundingSchema = new Schema({
  fundingReq: {
    currencyType: String,
    value: String
  },
  categories: [{
    name: String,
    premoney: String,
    postmoney: String
  }],
  newFunding: String
});

const partialExitSchema = new Schema({
  plannedExit: String,
  valuation: String,
  exitValue: String,
  existingOwnership: String,
  newOwnership: String,
  totalOwnership: String,
  partialExitVal: String
});

const fullExitSchema = new Schema({
  plannedExit: String,
  valuation: String,
  exitValue: String,
  existingOwnership: String,
  newOwnership: String,
  totalOwnership: String,
  fullExitVal: String
});
const yearlyRevenueSchema = new Schema({
  mainSources: [{
    source: String,
    targetUsers: Number,
    arpu: Number,
    revenue: Number,
    directCosts: Number,
    grossMargin: Number,
    grossProfit: Number
  }],
  miscSources: [{
    source: String,
    targetUsers: Number,
    arpu: Number,
    revenue: Number,
    directCosts: Number,
    grossMargin: Number,
    grossProfit: Number
  }],
  total: {
    targetUsers: String,
    arpu: String,
    revenue: String,
    directCosts: String,
    grossMargin: String,
    grossProfit: String
  },
  description: { type: String, default: '' }
});

// Update the slide5 schema
const slide5Schema = new Schema({
  revenueStartYear: Number,
  revenueStartMonth: Number,
  revenueTargetYear: Number,
  yearlyData: {
    type: Map,
    of: yearlyRevenueSchema,
    default: () => new Map()
  },
  revenueModelDesc: { type: String, default: '' }
});

const slide4DataSchema = new Schema({
  dataPoints: { type: Map, of: String, default: () => new Map() }
});

const ebitdaDataSchema = new Schema({
  dataPoints: {
    type: Map,
    of: new Schema({
      value: String,
      margin: String
    }),
    default: () => new Map()
  }
});
const editdabValuationSchema = new Schema({
  // Simplified to just store values without currency
  categories: {
    type: Map,
    of: String,  // Changed from nested object to simple string
    default: () => new Map()
  },
  negativeAdjustments: {
    type: String,
    default: ''
  },
  positiveAdjustments: {
    type: String,
    default: ''
  }
});

const histPerfSchema = new Schema({
  volume: { type: slide4DataSchema, default: () => ({}) },
  volumeDesc: { type: String, default: '' },
  revenue: { type: slide4DataSchema, default: () => ({}) },
  revenueDesc: { type: String, default: '' },
  ebitda: { type: ebitdaDataSchema, default: () => ({}) },
  ebitdaDesc: { type: String, default: '' }
});

// Slide schemas
const slideBaseSchema = {
  Slide0: new Schema({
    image: { type: imageSchema, default: () => ({}) },
    logo: { type: imageSchema, default: () => ({}) },
    claim: { type: String, default: '' },
    month_year: { type: String, default: '' }
  }),

  Slide1: new Schema({
    operationType: String,
    valuationMethod: String,
    sharesOffer: String,
    currency: String
  }),

  Slide2: new Schema({
    businessInfo: {
      name: { type: String, default: '' },
      logo: imageSchema
    },
    productPictures: [imageSchema],
    founders: [{
      image: imageSchema,
      name: { type: String, default: '' },
      background: { type: String, default: '' }
    }],
    strengths: {
      type: Map,
      of: String,
      default: () => new Map()
    },
    targetedMarketSize: {
      year: Number,
      segments: { type: Map, of: Number, default: () => new Map() },
      totalValue: marketTotalValueSchema
    },
    opportunity_data: {
      currentYear: { type: Number },
      targetYear: Number,
      currentValue: marketTotalValueSchema,
      futureValue: marketTotalValueSchema,
      cagr: { type: String, default: '' }
    },
    developmentFields: {
      productDev: [String],
      targetCustomers: [String],
      marketUsp: [String]
    }
  }),

  Slide3: new Schema({
    timelineData: {
      type: Map,
      of: new Schema({
        year: String,
        content: String,
        position: { type: String, enum: ['top', 'bottom'] }
      }),
      default: () => new Map()
    }
  }),

  slide5: new Schema({
    revenueStartYear: Number,
    revenueStartMonth: Number,
    revenueTargetYear: Number,
    yearlyData: { type: Map, of: yearlyRevenueSchema, default: () => new Map() },
    revenueModelDesc: { type: String, default: '' }
  }),

  slide6: new Schema({
    profitEstimates: [{
      name: String,
      values: { type: Map, of: String }
    }],
    kpiMetrics: [{
      name: String,
      unit: String,
      values: { type: Map, of: String }
    }]
  }),

  slide7: new Schema({
    content: [{
        text: String,
        bar_or_line: { type: String, default: 'bar' }
    }],
}),

  slide8: new Schema({
    cashEstimates: [{
      name: String,
      values: { type: Map, of: String }
    }],
    workingCapital: { type: String, default: '' },
    capex: { type: String, default: '' }
  }),

  slide9: new Schema({
    dcfBased: {
      discountRate: Number,
      perpetualGrowthRate: Number,
      netDebt: Number,
      tableData: [{
        name: String,
        values: { type: Map, of: String }
      }]
    },
    newIssue: {
      existingInvestors: { type: String, default: '' },
      newInvestors: { type: String, default: '' },
      tableData: [{
        name: String,
        values: { type: Map, of: String }
      }]
    },
    spend: {
      categories: { type: Map, of: Number, default: () => new Map() }
    },
    seriesAnotes: { type: String, default: '' }
  }),

  slide10: new Schema({
    dcfBased: {
      discountRate: Number,
      perpetualGrowthRate: Number,
      netDebt: Number,
      tableData: [{
        name: String,
        values: { type: Map, of: String }
      }]
    },
    existingStake: {
      type: Map,
      of: String,
      default: () => new Map()
    },
    exit_ofs: { type: String, default: '' }
  }),
  slide11: new Schema({
    ebitdaMultiple: Number,
    externalNetDebt: Number,
    ebitda_basedSchema: {
      categories: {
        type: Map,
        of: new Schema({
          value: { type: String, default: '' }  // Removed currency field
        }),
        default: () => new Map()
      },
      negativeAdjustments: { type: String, default: '' },
      positiveAdjustments: { type: String, default: '' }
    },
    newIssue: {
      existingInvestors: { type: String, default: '' },
      newInvestors: { type: String, default: '' },
      tableData: [{
        name: String,
        values: { type: Map, of: String }
      }]
    },
    spend: {
      categories: { type: Map, of: Number, default: () => new Map() }
    },
    seriesAnotes: { type: String, default: '' }
  }),

  slide12: new Schema({
    ebitdaMultiple: Number,
    externalNetDebt: Number,
    ebitda_basedSchema: {
      categories: {
        type: Map,
        of: new Schema({
          value: { type: String, default: '' }  // Removed currency field
        }),
        default: () => new Map()
      },
      negativeAdjustments: { type: String, default: '' },
      positiveAdjustments: { type: String, default: '' }
    },
    existingStake: {
      type: Map,
      of: String,
      default: () => new Map()
    },
    seriesAnotes: { type: String, default: '' }
  }),
  slide13: new Schema({
    contentPairs: [{
      image: imageSchema,
      description: { type: String, default: '' }
    }]
  }),

  slide14: new Schema({
    name_final: { type: String, default: '' },
    description_final: { type: String, default: '' },
    ph_no: { type: String, default: '' },
    mail: { type: String, default: '' },
    image: imageSchema,
  })
};

// Schema for proposal versions
const proposalVersionSchema = new Schema({
  versionNumber: { type: String, required: true }, // e.g., "A", "B"
  proposalName: { type: String, trim: true },
  businessDesc: { type: String, trim: true },
  products: { type: String, trim: true },
  proposalDesc: { type: String, trim: true },
  proposalType: {
    type: String,
    enum: ['Equity Funding', 'Partial', 'Full'],
    required: true
  },
  currentValuation: { type: String },
  currentShares: { type: String },
  
  // Type-specific details (only one will be populated based on proposalType)
  equityFundingDetails: equityFundingSchema,
  partialExitDetails: partialExitSchema,
  fullExitDetails: fullExitSchema,
  investment_offer:String,
  documents_proposal: [proposalDocumentSchema],

  status: {
    type: String,
    enum: ['active', 'requested', 'hold'],
    default: 'active'
  },
  holdRequestReason: {
    type: String,
    default: ''
  },
  rejectionReason: {
    type: String,
    default: ''
  },

  

  // Add timestamps for each version
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Schema for individual proposals
const proposalSchema = new Schema({
  proposalNumber: {
    type: String,
    required: true
  }, // e.g., "P1", "P2"
  versions: [proposalVersionSchema],
  documents_proposal: [proposalDocumentSchema], // Documents specific to this proposal
});

const investorConnectionSchema = new Schema({
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investor',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'connected'],
    default: 'pending'
  },
  paymentDetails: {
    orderId: String,
    paymentId: String,
    amount: String,
    timestamp: { type: Date, default: Date.now }
  },
  selectedProposal: {
    proposalId: String,
    versionId: String
  }
});

const businessProposalSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Base company/business details
  personalName: { type: String, trim: true },
  businessLegalName: { type: String, trim: true },
  mobileNo: { type: String, trim: true },
  primaryEmail: { type: String, trim: true, lowercase: true },
  designation: { type: String, trim: true },
  legalEntityType: { type: String, trim: true },
  establishedYear: { type: String },
  businessLocation: { type: String, trim: true },
  industry: { type: String, trim: true },
  shortBusinessDesc: { type: String, trim: true },
  businessDesc: { type: String, trim: true },
  keyProducts: { type: String, trim: true },
  businessStrengths: { type: String, trim: true },
  annualSales: { type: String, default: '0' },
  annualEBITDA: { type: String, default: '0' },
  monthlySales: { type: String, default: '0' },
  totalAssets: { type: String, default: '0' },
  totalLiabilities: { type: String, default: '0' },
  documents: [documentSchema],

  termsAccepted: {
    type: Boolean,
    default: false,
    required: true
  },

  paymentStatus: {
    isComplete: { type: Boolean, default: false },
    paymentDetails: {
      orderId: String,
      paymentId: String,
      amount: String,
      timestamp: { type: Date, default: Date.now }
    }
  },
  
  businessType: String,
  valuationType: String,
  pitchCreationType: String,
  
  advisorDetails: {
    type: {
      type: String,
      enum: ['advisor', 'self']
    },
    cost: {
      type: String,
    }
  },

  investorConnections: [investorConnectionSchema],

  status: {
    type: String,
    enum: ['active', 'requested', 'hold'],
    default: 'active'
  },
  holdRequestReason: {
    type: String,
    default: ''
  },
  rejectionReason: {
    type: String,
    default: ''
  },

  
  pitchDocument: {
    Slide0: { type: slideBaseSchema.Slide0, default: () => ({}) },
    Slide1: { type: slideBaseSchema.Slide1, default: () => ({}) },
    Slide2: { type: slideBaseSchema.Slide2, default: () => ({}) },
    Slide3: { type: slideBaseSchema.Slide3, default: () => ({}) },
    slide4: { type: histPerfSchema, default: () => ({}) },
    slide5: { type: slideBaseSchema.slide5, default: () => ({}) },
    slide6: { type: slideBaseSchema.slide6, default: () => ({}) },
    slide7: { type: slideBaseSchema.slide7, default: () => ({}) },
    slide8: { type: slideBaseSchema.slide8, default: () => ({}) },
    slide9: { type: slideBaseSchema.slide9, default: () => ({}) },
    slide10: { type: slideBaseSchema.slide10, default: () => ({}) },
    slide11: { type: slideBaseSchema.slide11, default: () => ({}) },
    slide12: { type: slideBaseSchema.slide12, default: () => ({}) },
    slide13: { type: slideBaseSchema.slide13, default: () => ({}) },
    slide14: { type: slideBaseSchema.slide14, default: () => ({}) }
  },
  
  dcfValuation: { type: dcfValuationSchema, default: () => ({}) },
  ebitdaValuation: { type: ebitdaValuationSchema, default: () => ({}) },
  
  // Array of proposals
  proposals: [proposalSchema],
  filter: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const BusinessProposal = mongoose.model('BusinessProposal', businessProposalSchema);
module.exports = BusinessProposal;