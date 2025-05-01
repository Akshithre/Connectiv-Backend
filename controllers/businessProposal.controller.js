const BusinessProposal = require('../models/businessProposal.model');
const Transaction = require('../models/transactions.model'); // Add this import
const Notification = require('../models/notifications.model');
const Investor = require('../models/investorSide.model');
const calculateCAGR = (finalValue, initialValue, years) => {
  if (
    !finalValue ||
    !initialValue ||
    finalValue <= 0 ||
    initialValue <= 0 ||
    !years ||
    years === 0
  )
    return 0;
  return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
};

const getRevenuePoints = (cagr) => {
  if (cagr > 15) return 9;
  if (cagr > 10) return 7;
  if (cagr > 5) return 5;
  if (cagr > 0) return 3;
  if (cagr >= -10) return 1;
  return 0;
};

const getEBITDAPoints = (cagr) => {
  if (cagr > 20) return 9;
  if (cagr > 15) return 7;
  if (cagr > 10) return 5;
  if (cagr > 5) return 3;
  if (cagr >= 0) return 1;
  return 0;
};

const getROCEPoints = (roce) => {
  if (roce > 20) return 9;
  if (roce > 15) return 7;
  if (roce >= 10 && roce <= 15) return 5;
  if (roce >= 5 && roce < 10) return 3;
  if (roce >= 0 && roce < 5) return 1;
  return 0;
};
exports.businessProposalController = {
  createProposal: async (req, res) => {
    try {
      // Destructure basic form fields from request body
      const {
        userId,
        personalName,
        businessLegalName,
        mobileNo,
        primaryEmail,
        designation,
        legalEntityType,
        establishedYear,
        businessLocation,
        industry,
        shortBusinessDesc,
        businessDesc,
        keyProducts,
        businessStrengths,
        annualSales,
        annualEBITDA,
        monthlySales,
        totalAssets,
        totalLiabilities,
        termsAccepted,
        documents,
        requestHold,
        updateStatus,
        // New fields for proposal version
        proposals,
      } = req.body;

      // Format documents array from uploaded files
      let formattedDocuments = [];
      if (Array.isArray(documents) && documents.length > 0) {
        formattedDocuments = documents.map((doc) => ({
          type: doc.type
            .toLowerCase()
            .replace("photo", "photo")
            .replace("doc", "doc")
            .replace("material", "doc"),
          file: doc.file,
        }));
      }

      // Format proposals array with version details
      let formattedProposals = [];
      if (Array.isArray(proposals) && proposals.length > 0) {
        formattedProposals = proposals.map((proposal) => ({
          proposalNumber: proposal.proposalNumber,
          documents_proposal: Array.isArray(proposal.documents_proposal)
            ? proposal.documents_proposal.map((doc) => ({
                type: doc.type
                  .toLowerCase()
                  .replace("photo", "photo")
                  .replace("doc", "doc")
                  .replace("material", "material"),
                file: doc.file,
              }))
            : [],
          versions: proposal.versions.map((version) => ({
            versionNumber: version.versionNumber,
            proposalName: version.proposalName || "",
            businessDesc: version.businessDesc || "",
            products: version.products || "",
            proposalDesc: version.proposalDesc || "",
            proposalType: version.proposalType,
            currentValuation: version.currentValuation || "",
            currentShares: version.currentShares || "",
            investment_offer: version.investment_offer || "",
            // Type-specific details based on proposalType
            ...(version.proposalType === "Equity Funding" && {
              equityFundingDetails: {
                fundingReq: {
                  currencyType:
                    version.equityFundingDetails?.fundingReq?.currencyType ||
                    "",
                  value: version.equityFundingDetails?.fundingReq?.value || "",
                },
                categories: version.equityFundingDetails?.categories || [],
                newFunding: version.equityFundingDetails?.newFunding || "",
              },
            }),

            ...(version.proposalType === "Partial" && {
              partialExitDetails: {
                plannedExit: version.partialExitDetails?.plannedExit || "",
                valuation: version.partialExitDetails?.valuation || "",
                exitValue: version.partialExitDetails?.exitValue || "",
                existingOwnership:
                  version.partialExitDetails?.existingOwnership || "",
                newOwnership: version.partialExitDetails?.newOwnership || "",
                totalOwnership:
                  version.partialExitDetails?.totalOwnership || "",
                partialExitVal:
                  version.partialExitDetails?.partialExitVal || "",
              },
            }),

            ...(version.proposalType === "Full" && {
              fullExitDetails: {
                plannedExit: version.fullExitDetails?.plannedExit || "",
                valuation: version.fullExitDetails?.valuation || "",
                exitValue: version.fullExitDetails?.exitValue || "",
                existingOwnership:
                  version.fullExitDetails?.existingOwnership || "",
                newOwnership: version.fullExitDetails?.newOwnership || "",
                totalOwnership: version.fullExitDetails?.totalOwnership || "",
                fullExitVal: version.fullExitDetails?.fullExitVal || "",
              },
            }),
          })),
        }));
      }

      // Create new business proposal with validated data
      const proposal = await BusinessProposal.create({
        userId,
        personalName: personalName || "",
        businessLegalName: businessLegalName || "",
        mobileNo: mobileNo || "",
        primaryEmail: primaryEmail || "",
        designation: designation || "",
        legalEntityType: legalEntityType || "",
        establishedYear: establishedYear || null,
        businessLocation: businessLocation || "",
        industry: industry || "",
        shortBusinessDesc: shortBusinessDesc || "",
        businessDesc: businessDesc || "",
        keyProducts: keyProducts || "",
        businessStrengths: businessStrengths || "",
        annualSales: Number(annualSales) || 0,
        annualEBITDA: Number(annualEBITDA) || 0,
        monthlySales: Number(monthlySales) || 0,
        totalAssets: Number(totalAssets) || 0,
        totalLiabilities: Number(totalLiabilities) || 0,
        termsAccepted: Boolean(termsAccepted),
        documents: formattedDocuments,
        dcfValuation: {},
        ebitdaValuation: {},
        proposals: formattedProposals,
      });

      // Send success response
      res.status(201).json({
        status: true,
        message: "Business proposal created successfully",
        data: proposal,
      });
    } catch (error) {
      // Error handling
      console.error("Create Proposal Error:", error);
      res.status(500).json({
        status: false,
        message: error.message,
      });
    }
  },

 // In businessProposal.controller.js
updateProposal: async (req, res) => {
  try {
    const { proposalId, ...updateData } = req.body;

    if (!proposalId) {
      return res.status(400).json({
        status: false,
        message: "Proposal ID is required",
      });
    }

    // First get the existing proposal to preserve version statuses
    const existingProposal = await BusinessProposal.findById(proposalId);
    
    // Create a map of existing version statuses
    const existingVersionStatuses = new Map();
    existingProposal.proposals.forEach(proposal => {
      proposal.versions.forEach(version => {
        const key = `${proposal.proposalNumber}-${version.versionNumber}`;
        existingVersionStatuses.set(key, {
          status: version.status || 'active',
          holdRequestReason: version.holdRequestReason || '',
          rejectionReason: version.rejectionReason || ''
        });
      });
    });

    // Update the proposals array to preserve statuses
    if (updateData.proposals) {
      updateData.proposals = updateData.proposals.map(proposal => ({
        ...proposal,
        versions: proposal.versions.map(version => {
          const versionKey = `${proposal.proposalNumber}-${version.versionNumber}`;
          const existingStatus = existingVersionStatuses.get(versionKey) || {
            status: 'active',
            holdRequestReason: '',
            rejectionReason: ''
          };

          return {
            ...version,
            status: existingStatus.status,
            holdRequestReason: existingStatus.holdRequestReason,
            rejectionReason: existingStatus.rejectionReason
          };
        })
      }));
    }

    const updatedProposal = await BusinessProposal.findByIdAndUpdate(
      proposalId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProposal) {
      return res.status(404).json({
        status: false,
        message: "Business proposal not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Business proposal updated successfully",
      data: updatedProposal,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
},

  updateValuation: async (req, res) => {
    try {
      const {
        proposalId,
        businessType,
        valuationType,
        revenue,
        ebitda,
        capex,
        wcap_days,
        perpetualGrowthRate = 0.05, // Default 5%
        wcap,
        grossDebt,
        capitalEmployed,
      } = req.body;

      if (!proposalId || !businessType || !valuationType) {
        return res.status(400).json({
          status: false,
          message: "ProposalId, businessType, and valuationType are required",
        });
      }

      let valuationData = {};
      let calculatedValuation = 0;
      let rating = "AA+";

      // Calculate valuation based on type
      if (valuationType === "ebitda") {
        // Get the years sorted
        const years = Object.keys(revenue || {}).sort();
        if (years.length < 1) {
          return res.status(400).json({
            status: false,
            message:
              "At least one year of data is required for EBITDA valuation",
          });
        }

        const lastYear = years[years.length - 1];
        const firstYear = years[0];

        // Calculate growth rates
        const lastYearRevenue = parseFloat(revenue[lastYear]) || 0;
        console.log(lastYearRevenue);
        const firstYearRevenue = parseFloat(revenue[firstYear]) || 0;
        console.log(firstYearRevenue);
        const lastYearEbitda = parseFloat(ebitda[lastYear]) || 0;
        console.log(lastYearEbitda);
        const firstYearEbitda = parseFloat(ebitda[firstYear]) || 0;
        console.log(firstYearEbitda);
        const revenueCagr = calculateCAGR(
          lastYearRevenue,
          firstYearRevenue,
          years.length - 1
        );
        console.log(revenueCagr);
        const ebitdaCagr = calculateCAGR(
          lastYearEbitda,
          firstYearEbitda,
          years.length - 1
        );
        console.log(ebitdaCagr);

        // Calculate ROCE
        const roce = capitalEmployed
          ? (lastYearEbitda / parseFloat(capitalEmployed)) * 100
          : 0;
        console.log(roce);
        // Calculate points
        const revenuePoints = getRevenuePoints(revenueCagr);
        console.log(revenuePoints);
        const ebitdaPoints = getEBITDAPoints(ebitdaCagr);
        console.log(ebitdaPoints);
        const rocePoints = getROCEPoints(roce);
        console.log(rocePoints);

        // Calculate weighted points (30% revenue, 40% EBITDA, 30% ROCE)
        const weightedPoints =
          revenuePoints * 0.3 + ebitdaPoints * 0.4 + rocePoints * 0.3;
        console.log(weightedPoints);
        // Get multiple adjustment and rating
        let multiple = 0;
        if (weightedPoints >= 9) {
          multiple = 3;
          rating = "A+";
        } else if (weightedPoints >= 7) {
          multiple = 2;
          rating = "A";
        } else if (weightedPoints >= 5) {
          multiple = 1;
          rating = "A-";
        } else if (weightedPoints >= 3) {
          multiple = 0;
          rating = "B";
        } else if (weightedPoints >= 1) {
          multiple = -1;
          rating = "B-";
        } else {
          multiple = -2;
          rating = "C";
        }
        console.log(multiple);
        // Calculate final valuation
        const baseMultiple = 12;
        const finalMultiple = baseMultiple + multiple;
        console.log(finalMultiple);
        calculatedValuation =
          lastYearEbitda * finalMultiple - parseFloat(grossDebt || 0);
        console.log(calculatedValuation);
        valuationData = {
          ebitdaValuation: {
            revenue,
            ebitda,
            grossDebt,
            valuation: Math.round(calculatedValuation),
            rating,
            capitalEmployed,
          },
        };
      } else if (valuationType === 'dcf') {
        const years = Object.keys(revenue || {}).sort();
        if (years.length < 1) {  // Changed from years.length < 5
          return res.status(400).json({
            status: false,
            message: 'At least one year of data is required for DCF valuation'
          });
        }
      
        // Calculate WCAP INR for each year
        const wcapInr = {};
        years.forEach(year => {
          wcapInr[year] = Math.round((parseFloat(revenue[year]) * parseFloat(wcap_days[year])) / 365);
        });
      
        // Calculate Incremental WCAP
        const incrementalWcap = {};
        years.forEach((year, index) => {
          if (index === 0) {
            incrementalWcap[year] = wcapInr[year];
          } else {
            incrementalWcap[year] = wcapInr[year] - wcapInr[years[index - 1]];
          }
        });
      
        // Calculate FCF for each year
        const fcf = {};
        years.forEach(year => {
          fcf[year] = parseFloat(ebitda[year]) - parseFloat(capex[year]) - incrementalWcap[year];
        });
      
        // Calculate PV Factors and Values
        const discountRate = 0.12; // 12%
        const pvFactors = {};
        const pvValues = {};
        years.forEach((year, index) => {
          pvFactors[year] = Math.pow(1 / (1 + Math.abs(discountRate)), index + 1);
          pvValues[year] = fcf[year] * pvFactors[year];
        });
      
        // Calculate Perpetual Values - use the last available year's data
        const lastYear = years[years.length - 1];
        const perpetualRevenue = parseFloat(revenue[lastYear]) * (1 + Math.abs(perpetualGrowthRate));
        const perpetualEbitda = (parseFloat(ebitda[lastYear]) / parseFloat(revenue[lastYear])) * perpetualRevenue;
        const perpetualCapex = (parseFloat(capex[lastYear]) / parseFloat(revenue[lastYear])) * perpetualRevenue;
        const perpetualWcapInr = (wcapInr[lastYear] / parseFloat(revenue[lastYear])) * perpetualRevenue;
        const perpetualIncrementalWcap = perpetualWcapInr - wcapInr[lastYear];
        const perpetualFcf = perpetualEbitda - perpetualCapex - perpetualIncrementalWcap;
        const perpetualPvFactor = 1 / Math.abs(discountRate);
        const perpetualPv = perpetualFcf * perpetualPvFactor;
      
        // Calculate Enterprise Value
        const ev = Object.values(pvValues).reduce((sum, pv) => sum + pv, 0) + perpetualPv;
      
        // Calculate Capital Employed progression and Cash ROCE
        const capitalEmployedValues = {};
        let currentCapitalEmployed = parseFloat(capitalEmployed);
        years.forEach((year, index) => {
          if (index === 0) {
            capitalEmployedValues[year] = currentCapitalEmployed;
          } else {
            currentCapitalEmployed += fcf[years[index - 1]];
            capitalEmployedValues[year] = currentCapitalEmployed;
          }
        });
      
        // Adjust CAGR calculation based on available years
        let revenueCagr = 0;
        let ebitdaCagr = 0;
        if (years.length >= 3) {
          // If we have 3 or more years, calculate CAGR using second year to last year
          revenueCagr = calculateCAGR(
            parseFloat(revenue[years[years.length - 1]]),
            parseFloat(revenue[years[1]]),
            years.length - 2
          );
          ebitdaCagr = calculateCAGR(
            parseFloat(ebitda[years[years.length - 1]]),
            parseFloat(ebitda[years[1]]),
            years.length - 2
          );
        } else {
          // For less than 3 years, use whatever data we have
          revenueCagr = calculateCAGR(
            parseFloat(revenue[years[years.length - 1]]),
            parseFloat(revenue[years[0]]),
            years.length - 1
          );
          ebitdaCagr = calculateCAGR(
            parseFloat(ebitda[years[years.length - 1]]),
            parseFloat(ebitda[years[0]]),
            years.length - 1
          );
        }
      
        const cashRoce = (parseFloat(ebitda[lastYear]) / capitalEmployedValues[lastYear]) * 100;
      
        // Calculate Rating
        const revenuePoints = getRevenuePoints(revenueCagr);
        const ebitdaPoints = getEBITDAPoints(ebitdaCagr);
        const rocePoints = getROCEPoints(cashRoce);
        const weightedPoints = (revenuePoints * 0.3) + (ebitdaPoints * 0.4) + (rocePoints * 0.3);
      
        if (weightedPoints >= 9) { rating = "A+"; }
        else if (weightedPoints >= 7) { rating = "A"; }
        else if (weightedPoints >= 5) { rating = "A-"; }
        else if (weightedPoints >= 3) { rating = "B"; }
        else if (weightedPoints >= 1) { rating = "B-"; }
        else { rating = "C"; }
      
        calculatedValuation = ev - parseFloat(grossDebt || 0);
      
        valuationData = {
          dcfValuation: {
            revenue,
            ebitda,
            capex,
            wcap_days,
            perpetualGrowthRate,
            wcap,
            grossDebt,
            valuation: Math.round(calculatedValuation),
            rating,
            capitalEmployed
          }
        };
      }

      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        {
          $set: {
            businessType,
            valuationType,
            ...valuationData,
          },
        },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      // Structure the response to match frontend expectations
      const responseData = {
        status: true,
        message: "Valuation updated successfully",
        data: {
          ...updatedProposal.toObject(),
          valuation:
            valuationType === "ebitda"
              ? updatedProposal.ebitdaValuation?.valuation
              : updatedProposal.dcfValuation?.valuation,
          rating:
            valuationType === "ebitda"
              ? updatedProposal.ebitdaValuation?.rating
              : updatedProposal.dcfValuation?.rating,
        },
      };

      res.status(200).json(responseData);
    } catch (error) {
      console.error("Update Valuation Error:", error);
      res.status(500).json({
        status: false,
        message: error.message,
      });
    }
  },
  // Helper functions

  createValuation: async (req, res) => {
    //doubt
    try {
      const {
        proposalId,
        businessType,
        valuationType,
        revenue,
        ebitda,
        capex,
        wcap_days,
        perpetualGrowthRate,
        wcap,
        grossDebt,
        assumptions,
        industryMultiples,
        capitalEmployed,
      } = req.body;

      if (!proposalId || !businessType || !valuationType) {
        return res.status(400).json({
          status: false,
          message: "ProposalId, businessType, and valuationType are required",
        });
      }

      let valuationData = {};
      let calculatedValuation = 0;

      // Calculate valuation based on type
      if (valuationType === "ebitda") {
        if (!revenue || !ebitda || !industryMultiples) {
          return res.status(400).json({
            status: false,
            message:
              "Revenue, EBITDA and industry multiples are required for EBITDA valuation",
          });
        }

        const revenueFirstYear = Object.values(revenue)[0] || 0;
        const ebitdaFirstYear = Object.values(ebitda)[0] || 0;
        calculatedValuation =
          ebitdaFirstYear * industryMultiples.ebitdaMultiple - grossDebt;

        valuationData = {
          ebitdaValuation: {
            revenue,
            ebitda,
            grossDebt,
            industryMultiples,
            assumptions,
            valuation: calculatedValuation,
            calculationDate: new Date(),
            rating: "AA+",
            capitalEmployed,
          },
        };
      } else if (valuationType === "dcf") {
        if (
          !revenue ||
          !ebitda ||
          !capex ||
          !wcap_days ||
          !perpetualGrowthRate
        ) {
          return res.status(400).json({
            status: false,
            message:
              "Revenue, EBITDA, CAPEX, and perpetual growth rate are required for DCF valuation",
          });
        }

        // More sophisticated DCF calculation would go here
        const revenueFirstYear = Object.values(revenue)[0] || 0;
        const ebitdaFirstYear = Object.values(ebitda)[0] || 0;
        const capexFirstYear = Object.values(capex)[0] || 0;
        calculatedValuation =
          revenueFirstYear + ebitdaFirstYear - capexFirstYear - grossDebt;

        valuationData = {
          dcfValuation: {
            revenue,
            ebitda,
            capex,
            wcap_days,
            perpetualGrowthRate,
            wcap,
            grossDebt,
            assumptions,
            valuation: calculatedValuation,
            calculationDate: new Date(),
            rating: "AA+",
            capitalEmployed,
          },
        };
      }

      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        {
          $set: {
            businessType,
            valuationType,
            ...valuationData,
            lastValuationDate: new Date(),
          },
        },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "Valuation created successfully",
        data: updatedProposal,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message,
      });
    }
  },

  getPaymentStatus: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      // Update to include advisorDetails in the projection
      const proposal = await BusinessProposal.findById(
        proposalId,
        "paymentStatus advisorDetails"
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        data: {
          isComplete: proposal.paymentStatus?.isComplete || false,
          paymentDetails: proposal.paymentStatus?.paymentDetails || null,
          advisorType: proposal.advisorDetails?.type || null,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message,
      });
    }
  },

  deleteValuation: async (req, res) => {
    try {
      const { proposalId } = req.body;

      // Check if proposalId is provided
      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      // Define update query to clear both dcfValuation and ebitdaValuation
      const updateQuery = {
        $set: {
          dcfValuation: {},
          ebitdaValuation: {},
        },
      };

      // Find and update the proposal by proposalId
      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        updateQuery,
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "No business proposal found with the given Proposal ID",
        });
      }

      res.status(200).json({
        status: true,
        message: "Valuations deleted successfully",
        data: updatedProposal,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message,
      });
    }
  },

  getAllProposals: async (req, res) => {
    try {
      const { userId } = req.body;

      // If userId is provided, filter by userId, otherwise return all proposals
      const query = userId ? { userId } : {};

      const proposals = await BusinessProposal.find(query);

      res.status(200).json({
        status: true,
        data: proposals,
      });
    } catch (error) {
      console.error("Error in getAllProposals:", error);
      res.status(500).json({
        status: false,
        message: error.message,
      });
    }
  },
  getProposalById: async (req, res) => {
    try {
      // Get proposalId from URL parameters
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(proposalId);
      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        data: proposal,
      });
    } catch (error) {
      console.error("Error in getProposalById:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  // updateProposal: async (req, res) => {
  //   try {
  //     const { proposalId, ...updateData } = req.body;

  //     if (!proposalId) {
  //       return res.status(400).json({
  //         status: false,
  //         message: 'Proposal ID is required'
  //       });
  //     }

  //     const proposal = await BusinessProposal.findByIdAndUpdate(
  //       proposalId,
  //       updateData,
  //       { new: true, runValidators: true }
  //     );

  //     if (!proposal) {
  //       return res.status(404).json({
  //         status: false,
  //         message: 'Business proposal not found'
  //       });
  //     }

  //     res.status(200).json({
  //       status: true,
  //       message: 'Business proposal updated successfully',
  //       data: proposal
  //     });
  //   } catch (error) {
  //     res.status(500).json({
  //       status: false,
  //       message: error.message
  //     });
  //   }
  // },

  // Controller function
  deleteProposal: async (req, res) => {
    try {
      const { proposalId } = req.body;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findByIdAndDelete(proposalId);
      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "Business proposal deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message,
      });
    }
  },
  updateAdvisorDetails: async (req, res) => {
    try {
      const { proposalId, advisorType } = req.body;

      if (!proposalId || !advisorType) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID and advisor type are required",
        });
      }

      // Validate advisor type
      if (!["advisor", "self"].includes(advisorType)) {
        return res.status(400).json({
          status: false,
          message: 'Invalid advisor type. Must be either "advisor" or "self"',
        });
      }

      // Calculate cost based on advisor type
      const cost = advisorType === "advisor" ? 3000 : 5000;

      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        {
          $set: {
            advisorDetails: {
              type: advisorType,
              cost: cost,
            },
          },
        },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "Advisor details updated successfully",
        data: updatedProposal,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message,
      });
    }
  },

  getAdvisorDetails: async (req, res) => {
    try {
      const { proposalId } = req.body;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(
        proposalId,
        "advisorDetails"
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        data: proposal.advisorDetails || {},
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message,
      });
    }
  },

  // businessProposal.controller.js excerpt
createInvestorConnection: async (req, res) => {
  try {
    const { 
      proposalId, 
      investorId, 
      selectedProposal,
      paymentDetails 
    } = req.body;

    console.log('Received data:', {
      proposalId,
      investorId,
      selectedProposal,
      paymentDetails
    });

    // Validate required fields
    if (!proposalId || !investorId || !selectedProposal || !paymentDetails) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields"
      });
    }

    const connection = {
      investorId,
      status: 'connected',
      paymentDetails,
      selectedProposal: {
        proposalId: selectedProposal.proposalId,
        versionId: selectedProposal.versionId
      }
    };

    const updatedProposal = await BusinessProposal.findByIdAndUpdate(
      proposalId,
      {
        $push: { investorConnections: connection }
      },
      { 
        new: true,
        runValidators: true
      }
    ).populate('investorConnections.investorId');

    if (!updatedProposal) {
      return res.status(404).json({
        status: false,
        message: "Business proposal not found"
      });
    }

    res.status(200).json({
      status: true,
      message: "Investor connection created successfully",
      data: updatedProposal
    });
  } catch (error) {
    console.error("Create Investor Connection Error:", error);
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
},

  getInvestorConnections: async (req, res) => {
    try {
      const { proposalId } = req.params;

      const proposal = await BusinessProposal.findById(proposalId)
        .populate('investorConnections.investorId');

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found"
        });
      }

      res.status(200).json({
        status: true,
        data: proposal.investorConnections
      });
    } catch (error) {
      console.error("Get Investor Connections Error:", error);
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  },

  requestHold: async (req, res) => {
    try {
      const { proposalId, proposalNumber, versionNumber, reason } = req.body;
  
      const updatedProposal = await BusinessProposal.findOneAndUpdate(
        {
          _id: proposalId,
          'proposals.proposalNumber': proposalNumber,
          'proposals.versions.versionNumber': versionNumber
        },
        {
          $set: {
            'proposals.$[prop].versions.$[ver].status': 'requested',
            'proposals.$[prop].versions.$[ver].holdRequestReason': reason
          }
        },
        {
          arrayFilters: [
            { 'prop.proposalNumber': proposalNumber },
            { 'ver.versionNumber': versionNumber }
          ],
          new: true
        }
      );
  
      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: 'Proposal version not found'
        });
      }
  
      res.status(200).json({
        status: true,
        message: 'Hold request submitted successfully',
        data: updatedProposal
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  },
  updateProposalStatus: async (req, res) => {
    try {
      const { proposalId, proposalNumber, versionNumber, status, rejectionReason, userId } = req.body;
  
      // Update proposal status
      const updateData = {
        'proposals.$[prop].versions.$[ver].status': status
      };
  
      if (rejectionReason) {
        updateData['proposals.$[prop].versions.$[ver].rejectionReason'] = rejectionReason;
  
        // Create notification for rejection
        await Notification.create({
          userId: userId,
          title: 'Hold Request Rejected',
          message: `Hold request for proposal ${proposalNumber}/${versionNumber} was rejected. Reason: ${rejectionReason}`,
          read: false
        });
      }
  
      const updatedProposal = await BusinessProposal.findOneAndUpdate(
        { _id: proposalId },
        { $set: updateData },
        {
          arrayFilters: [
            { 'prop.proposalNumber': proposalNumber },
            { 'ver.versionNumber': versionNumber }
          ],
          new: true
        }
      );
  
      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: 'Proposal version not found'
        });
      }
  
      res.status(200).json({
        status: true,
        message: 'Status updated successfully',
        data: updatedProposal
      });
  
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  },

  getHoldRequests: async (req, res) => {
    try {
      const holdRequests = await BusinessProposal.aggregate([
        { $unwind: '$proposals' },
        { $unwind: '$proposals.versions' },
        {
          $match: {
            'proposals.versions.status': 'requested'
          }
        },
        {
          $project: {
            businessOwner: '$personalName',
            proposalVersion: {
              $concat: ['$proposals.proposalNumber', '/', '$proposals.versions.versionNumber']
            },
            status: '$proposals.versions.status',
            reason: '$proposals.versions.holdRequestReason',
            proposalId: '$_id',
            proposalNumber: '$proposals.proposalNumber',
            versionNumber: '$proposals.versions.versionNumber',
            userId: '$userId' // Include userId in the projection
          }
        }
      ]);
  
      res.status(200).json({
        status: true,
        data: holdRequests
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  },

  createNotification : async (userId, title, message) => {
    try {
      await Notification.create({ userId, title, message });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  },

   updateHoldStatus: async (req, res) => {
    try {
      const { proposalId, proposalNumber, versionNumber, status, rejectionReason } = req.body;
  
      if (!['active', 'requested', 'hold'].includes(status)) {
        return res.status(400).json({
          status: false,
          message: 'Invalid status value'
        });
      }
  
      const updateData = {
        'proposals.$[prop].versions.$[ver].status': status
      };
  
      if (rejectionReason) {
        updateData['proposals.$[prop].versions.$[ver].rejectionReason'] = rejectionReason;
      }
  
      if (status === 'hold') {
        updateData['proposals.$[prop].versions.$[ver].rejectionReason'] = '';
        
        // Find the proposal
        const proposal = await BusinessProposal.findById(proposalId);
        if (!proposal) {
          return res.status(404).json({
            status: false,
            message: 'Proposal not found'
          });
        }

        // Get affected connections
        const affectedConnections = proposal.investorConnections.filter(connection => 
          connection.selectedProposal?.proposalId === proposalNumber && 
          connection.selectedProposal?.versionId === versionNumber
        );

        console.log('Affected connections:', affectedConnections);

        // Create notifications for affected investors
        for (const connection of affectedConnections) {
          try {
            // Get the investor to find their userId
            const investor = await Investor.findById(connection.investorId);
            console.log('Found investor:', investor);

            if (investor) {
              // Create notification using the userId from investor document
              await Notification.create({
                userId: investor.userId, // This is the correct userId from your schema
                title: `Connection Removed - ${proposal.businessLegalName}`,
                message: `Your connection with ${proposal.businessLegalName} for proposal version ${proposalNumber}/${versionNumber} has been removed as the proposal has been put on hold.`
              });
              console.log(`Created notification for investor: ${investor.fullName} with userId: ${investor.userId}`);
            }
          } catch (notifError) {
            console.error('Error creating notification:', notifError);
          }
        }

        // Remove the connections from the proposal
        const updatedConnections = proposal.investorConnections.filter(connection => {
          return !(
            connection.selectedProposal?.proposalId === proposalNumber && 
            connection.selectedProposal?.versionId === versionNumber
          );
        });

        await BusinessProposal.findByIdAndUpdate(proposalId, {
          $set: {
            investorConnections: updatedConnections
          }
        });

        // Update transactions
        await Transaction.updateMany(
          {
            proposal: proposalId,
            business_version: `${proposalNumber}/${versionNumber}`
          },
          {
            $set: { status: 'inactive' }
          }
        );
      }
  
      const updatedProposal = await BusinessProposal.findOneAndUpdate(
        { _id: proposalId },
        { $set: updateData },
        {
          arrayFilters: [
            { 'prop.proposalNumber': proposalNumber },
            { 'ver.versionNumber': versionNumber }
          ],
          new: true
        }
      );
  
      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: 'Proposal version not found'
        });
      }
  
      res.status(200).json({
        status: true,
        message: 'Status updated successfully',
        data: updatedProposal
      });
    } catch (error) {
      console.error('Update hold status error:', error);
      res.status(500).json({
        status: false,
        message: error.message || 'Internal server error'
      });
    }
  },

  
  updateStatus: async (req, res) => {
    try {
      const { proposalId, status, rejectionReason } = req.body;
      
      const updateData = {
        status,
        ...(rejectionReason && { rejectionReason })
      };
  
      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        updateData,
        { new: true }
      );
  
      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found"
        });
      }
  
      res.status(200).json({
        status: true,
        message: "Status updated successfully",
        data: updatedProposal
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  },

  getAllProposalsAdmin: async (req, res) => {
    try {
      // Fetch all business proposals regardless of userId
      const proposals = await BusinessProposal.find()
        .sort({ createdAt: -1 })
        .populate('userId', 'fullName email phoneNumber'); // Optionally populate user details
  
      const proposalsWithStatus = proposals.map(proposal => ({
        ...proposal.toObject(),
        status: proposal.status || 'active' // Default to active if no status
      }));
  
      res.json({
        status: true,
        data: proposalsWithStatus
      });
    } catch (error) {
      console.error('Error in getAllProposalsAdmin:', error);
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  },

  updateBusinessStatus: async (req, res) => {
    try {
      const { proposalId, status } = req.body;
      
      if (!proposalId || !status) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID and status are required"
        });
      }
  
      if (!['active', 'requested', 'hold'].includes(status)) {
        return res.status(400).json({
          status: false,
          message: "Invalid status value"
        });
      }
  
      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { status },
        { new: true }
      );
  
      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found"
        });
      }
  
      res.json({
        status: true,
        data: updatedProposal
      });
    } catch (error) {
      console.error('Error in updateBusinessStatus:', error);
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  },

  clearRejectionReason: async (req, res) => {
    try {
      const { proposalId } = req.body;
  
      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { $unset: { rejectionReason: "" } },
        { new: true }
      );
  
      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found"
        });
      }
  
      res.status(200).json({
        status: true,
        message: "Rejection reason cleared successfully",
        data: updatedProposal
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  },



  updateSlide0: async (req, res) => {
    try {
      const { proposalId, image, logo, claim, month_year } = req.body;

      // Validate required fields
      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      // Format Slide0 data using dot notation for nested update
      const slide0Data = {
        "pitchDocument.Slide0": {
          image: image || {},
          logo: logo || {},
          claim: claim || "",
          month_year: month_year || "",
          lastUpdated: new Date(),
        },
      };

      // Find and update the proposal
      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { $set: slide0Data },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "Slide0 updated successfully",
        data: updatedProposal,
      });
    } catch (error) {
      console.error("Error in updateSlide0:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getSlide0: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(
        proposalId,
        "pitchDocument.Slide0 "
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      const slide0Data = {
        proposalId: proposal._id,

        slide0: {
          image: proposal.pitchDocument?.Slide0?.image || {},
          logo: proposal.pitchDocument?.Slide0?.logo || {},
          claim: proposal.pitchDocument?.Slide0?.claim || "",
          month_year: proposal.pitchDocument?.Slide0?.month_year || "",
        },
      };

      res.status(200).json({
        status: true,
        data: slide0Data,
      });
    } catch (error) {
      console.error("Error in getSlide0:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  updateSlide1: async (req, res) => {
    try {
      const {
        proposalId,
        operationType,
        valuationMethod,
        sharesOffer,
        currency,
      } = req.body;

      // Validate required fields
      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      if (!operationType || !valuationMethod || !sharesOffer || !currency) {
        return res.status(400).json({
          status: false,
          message:
            "All fields (operationType, valuationMethod, sharesOffer, currency) are required",
        });
      }

      // Format Slide1 data using dot notation for nested update
      const slide1Data = {
        "pitchDocument.Slide1": {
          operationType,
          valuationMethod,
          sharesOffer,
          currency,
          lastUpdated: new Date(),
        },
      };

      // Find and update the proposal
      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { $set: slide1Data },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "Slide1 updated successfully",
        data: updatedProposal,
      });
    } catch (error) {
      console.error("Error in updateSlide1:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getSlide1: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(
        proposalId,
        "pitchDocument.Slide1 "
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      const slide1Data = {
        proposalId: proposal._id,

        slide1: proposal.pitchDocument?.Slide1 || {},
      };

      res.status(200).json({
        status: true,
        data: slide1Data,
      });
    } catch (error) {
      console.error("Error in getSlide1:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },
  updateSlide2: async (req, res) => {
    try {
      const {
        proposalId,
        businessInfo,
        productPictures,
        founders,
        strengths,
        targetedMarketSize,
        opportunity_data,
        developmentFields,
      } = req.body;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      // Format Slide2 data
      const slide2Data = {
        "pitchDocument.Slide2": {
          businessInfo: businessInfo || {},
          productPictures: productPictures || [],
          founders: founders || [],
          strengths: new Map(Object.entries(strengths || {})),
          targetedMarketSize: targetedMarketSize || {},
          opportunity_data: opportunity_data || {},
          developmentFields: developmentFields || {},
        },
      };

      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { $set: slide2Data },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "Slide2 updated successfully",
        data: updatedProposal,
      });
    } catch (error) {
      console.error("Error in updateSlide2:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getSlide2: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(
        proposalId,
        "pitchDocument.Slide2 "
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      const slide2Data = {
        proposalId: proposal._id,

        slide2: proposal.pitchDocument?.Slide2 || {},
      };

      res.status(200).json({
        status: true,
        data: slide2Data,
      });
    } catch (error) {
      console.error("Error in getSlide2:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  // Update and Get functions for Slide 3
  updateSlide3: async (req, res) => {
    try {
      const { proposalId, timelineData } = req.body;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const slide3Data = {
        "pitchDocument.Slide3": {
          timelineData: timelineData || new Map(),
        },
      };

      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { $set: slide3Data },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "Slide3 updated successfully",
        data: updatedProposal,
      });
    } catch (error) {
      console.error("Error in updateSlide3:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getSlide3: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(
        proposalId,
        "pitchDocument.Slide3 "
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      const slide3Data = {
        proposalId: proposal._id,

        slide3: proposal.pitchDocument?.Slide3 || {},
      };

      res.status(200).json({
        status: true,
        data: slide3Data,
      });
    } catch (error) {
      console.error("Error in getSlide3:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  // Update and Get functions for Historical Performance
  updateslide4: async (req, res) => {
    try {
      const {
        proposalId,
        volume,
        volumeDesc,
        revenue,
        revenueDesc,
        ebitda,
        ebitdaDesc,
      } = req.body;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const slide4Data = {
        "pitchDocument.slide4": {
          volume: {
            dataPoints: volume.dataPoints || {},
          },
          volumeDesc: volumeDesc || "",
          revenue: {
            dataPoints: revenue.dataPoints || {},
          },
          revenueDesc: revenueDesc || "",
          ebitda: {
            dataPoints: ebitda.dataPoints || {},
          },
          ebitdaDesc: ebitdaDesc || "",
        },
      };

      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { $set: slide4Data },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "Historical Performance updated successfully",
        data: updatedProposal,
      });
    } catch (error) {
      console.error("Error in updateslide4:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  // Add the get method right after the update method
  getslide4: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(
        proposalId,
        "pitchDocument.slide4 "
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      const slide4Data = {
        proposalId: proposal._id,

        slide4: proposal.pitchDocument?.slide4 || {},
      };

      res.status(200).json({
        status: true,
        data: slide4Data,
      });
    } catch (error) {
      console.error("Error in getSlide4:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },
  // Update and Get functions for Slide 4
  updateslide5: async (req, res) => {
    try {
      const {
        proposalId,
        revenueStartYear,
        revenueStartMonth,
        revenueTargetYear,
        yearlyData,
        revenueModelDesc,
      } = req.body;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const slide5Data = {
        "pitchDocument.slide5": {
          revenueStartYear,
          revenueStartMonth,
          revenueTargetYear,
          yearlyData: yearlyData || new Map(),
          revenueModelDesc: revenueModelDesc || "",
        },
      };

      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { $set: slide5Data },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "slide5 updated successfully",
        data: updatedProposal,
      });
    } catch (error) {
      console.error("Error in updateslide5:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getslide5: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(
        proposalId,
        "pitchDocument.slide5 "
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      const slide5Data = {
        proposalId: proposal._id,

        slide5: proposal.pitchDocument?.slide5 || {},
      };

      res.status(200).json({
        status: true,
        data: slide5Data,
      });
    } catch (error) {
      console.error("Error in getSlide5:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  // Update and Get functions for Slide 5
  updateslide6: async (req, res) => {
    try {
      const { proposalId, profitEstimates, kpiMetrics } = req.body;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const slide6Data = {
        "pitchDocument.slide6": {
          profitEstimates: profitEstimates || [],
          kpiMetrics: kpiMetrics || [],
        },
      };

      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { $set: slide6Data },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "slide6 updated successfully",
        data: updatedProposal,
      });
    } catch (error) {
      console.error("Error in updateslide6:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getslide6: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(
        proposalId,
        "pitchDocument.slide6 "
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      const slide6Data = {
        proposalId: proposal._id,

        slide6: proposal.pitchDocument?.slide6 || {},
      };

      res.status(200).json({
        status: true,
        data: slide6Data,
      });
    } catch (error) {
      console.error("Error in getSlide6:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },
  updateslide7: async (req, res) => {
    try {
      const { proposalId, content } = req.body;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      // Transform the content array into the expected format
      const transformedContent = Array.isArray(content) ? content : [];

      const slide7Data = {
        "pitchDocument.slide7": {
          content: transformedContent,
        },
      };

      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { $set: slide7Data },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "slide7 updated successfully",
        data: updatedProposal,
      });
    } catch (error) {
      console.error("Error in updateslide7:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getslide7: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(
        proposalId,
        "pitchDocument.slide7 "
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      const slide7Data = {
        proposalId: proposal._id,

        slide7: proposal.pitchDocument?.slide7 || {},
      };

      res.status(200).json({
        status: true,
        data: slide7Data,
      });
    } catch (error) {
      console.error("Error in getSlide7:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  // Update and Get functions for Slide 7
  updateslide8: async (req, res) => {
    try {
      const { proposalId, cashEstimates, workingCapital, capex } = req.body;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const slide8Data = {
        "pitchDocument.slide8": {
          cashEstimates: cashEstimates || [],
          workingCapital: workingCapital || "",
          capex: capex || "",
        },
      };

      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { $set: slide8Data },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "slide8 updated successfully",
        data: updatedProposal,
      });
    } catch (error) {
      console.error("Error in updateslide8:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },
  getslide8: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(
        proposalId,
        "pitchDocument.slide8 "
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      const slide8Data = {
        proposalId: proposal._id,

        slide8: proposal.pitchDocument?.slide8 || {},
      };

      res.status(200).json({
        status: true,
        data: slide8Data,
      });
    } catch (error) {
      console.error("Error in getSlide8:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },
  // Update and Get functions for Slide 8
  updateslide9: async (req, res) => {
    try {
      const { proposalId, dcfBased, newIssue, spend, seriesAnotes } = req.body;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const slide9Data = {
        "pitchDocument.slide9": {
          dcfBased: dcfBased || {},
          newIssue: newIssue || {},
          spend: spend || {},
          seriesAnotes: seriesAnotes || "",
        },
      };

      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { $set: slide9Data },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "slide9 updated successfully",
        data: updatedProposal,
      });
    } catch (error) {
      console.error("Error in updateslide9:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getslide9: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(
        proposalId,
        "pitchDocument.slide9 "
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      const slide9Data = {
        proposalId: proposal._id,

        slide9: proposal.pitchDocument?.slide9 || {},
      };

      res.status(200).json({
        status: true,
        data: slide9Data,
      });
    } catch (error) {
      console.error("Error in getSlide9:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  // Update and Get functions for Slide 9
  updateslide10: async (req, res) => {
    try {
      const { proposalId, dcfBased, existingStake, exit_ofs } = req.body;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const slide10Data = {
        "pitchDocument.slide10": {
          dcfBased: dcfBased || {},
          existingStake: existingStake || {},
          exit_ofs: exit_ofs || "",
        },
      };

      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { $set: slide10Data },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "slide10 updated successfully",
        data: updatedProposal,
      });
    } catch (error) {
      console.error("Error in updateslide10:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getslide10: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(
        proposalId,
        "pitchDocument.slide10 "
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      const slide10Data = {
        proposalId: proposal._id,

        slide10: proposal.pitchDocument?.slide10 || {},
      };

      res.status(200).json({
        status: true,
        data: slide10Data,
      });
    } catch (error) {
      console.error("Error in getSlide10:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  // Update and Get functions for Slide 10
  updateslide11: async (req, res) => {
    try {
      const {
        proposalId,
        ebitdaMultiple,
        externalNetDebt,
        ebitda_basedSchema,
        newIssue,
        spend,
        seriesAnotes,
      } = req.body;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      // Transform categories to match schema structure
      const transformedCategories = new Map();
      if (ebitda_basedSchema?.categories) {
        Object.entries(ebitda_basedSchema.categories).forEach(
          ([key, value]) => {
            transformedCategories.set(key, { value: value.toString() });
          }
        );
      }

      // Transform spend categories if present
      let formattedSpend = {};
      if (spend?.categories) {
        const spendCategories = new Map();
        Object.entries(spend.categories).forEach(([key, value]) => {
          spendCategories.set(key, Number(value));
        });
        formattedSpend = { categories: spendCategories };
      }

      // Format newIssue data if present
      let formattedNewIssue = {};
      if (newIssue?.tableData) {
        formattedNewIssue = {
          existingInvestors: newIssue.existingInvestors || "",
          newInvestors: newIssue.newInvestors || "",
          tableData: newIssue.tableData.map((item) => ({
            name: item.name,
            values: new Map(Object.entries(item.values || {})),
          })),
        };
      }

      const slide11Data = {
        "pitchDocument.slide11": {
          ebitdaMultiple: ebitdaMultiple || 0,
          externalNetDebt: externalNetDebt || 0,
          ebitda_basedSchema: {
            categories: transformedCategories,
            negativeAdjustments: ebitda_basedSchema?.negativeAdjustments || "",
            positiveAdjustments: ebitda_basedSchema?.positiveAdjustments || "",
          },
          newIssue: formattedNewIssue,
          spend: formattedSpend,
          seriesAnotes: seriesAnotes || "",
        },
      };

      // Log the data being saved for debugging
      console.log("Saving slide11 Data:", JSON.stringify(slide11Data, null, 2));

      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { $set: slide11Data },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "slide11 updated successfully",
        data: updatedProposal,
      });
    } catch (error) {
      console.error("Error in updateslide11:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getslide11: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(
        proposalId,
        "pitchDocument.slide11 "
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      const slide11 = proposal.pitchDocument?.slide11 || {};

      // Transform categories Map back to object format
      const categories = {};
      if (slide11.ebitda_basedSchema?.categories) {
        for (const [
          key,
          data,
        ] of slide11.ebitda_basedSchema.categories.entries()) {
          categories[key] = data.value;
        }
      }

      // Transform spend categories if present
      const spendCategories = {};
      if (slide11.spend?.categories) {
        for (const [key, value] of slide11.spend.categories.entries()) {
          spendCategories[key] = value;
        }
      }

      // Transform newIssue table data if present
      let newIssueData = {};
      if (slide11.newIssue?.tableData) {
        newIssueData = {
          ...slide11.newIssue,
          tableData: slide11.newIssue.tableData.map((item) => ({
            name: item.name,
            values: Object.fromEntries(item.values || new Map()),
          })),
        };
      }

      const slide11Data = {
        proposalId: proposal._id,

        slide11: {
          ebitdaMultiple: slide11.ebitdaMultiple,
          externalNetDebt: slide11.externalNetDebt,
          ebitda_basedSchema: {
            categories,
            negativeAdjustments:
              slide11.ebitda_basedSchema?.negativeAdjustments || "",
            positiveAdjustments:
              slide11.ebitda_basedSchema?.positiveAdjustments || "",
          },
          newIssue: newIssueData,
          spend: { categories: spendCategories },
          seriesAnotes: slide11.seriesAnotes || "",
        },
      };

      res.status(200).json({
        status: true,
        data: slide11Data,
      });
    } catch (error) {
      console.error("Error in getSlide11:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  }, // Update and Get functions for Slide 11
  updateslide12: async (req, res) => {
    try {
      const {
        proposalId,
        ebitdaMultiple,
        externalNetDebt,
        ebitda_basedSchema,
        existingStake,
        seriesAnotes,
      } = req.body;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      // Transform categories to match schema structure
      const transformedCategories = new Map();
      if (ebitda_basedSchema?.categories) {
        Object.entries(ebitda_basedSchema.categories).forEach(
          ([key, value]) => {
            transformedCategories.set(key, { value: value.toString() });
          }
        );
      }

      // Transform existingStake to Map
      const transformedExistingStake = new Map();
      if (existingStake) {
        Object.entries(existingStake).forEach(([key, value]) => {
          transformedExistingStake.set(key, value.toString());
        });
      }

      const slide12Data = {
        "pitchDocument.slide12": {
          ebitdaMultiple,
          externalNetDebt,
          ebitda_basedSchema: {
            categories: transformedCategories,
            negativeAdjustments: ebitda_basedSchema?.negativeAdjustments || "",
            positiveAdjustments: ebitda_basedSchema?.positiveAdjustments || "",
          },
          existingStake: transformedExistingStake,
          seriesAnotes: seriesAnotes || "",
        },
      };

      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { $set: slide12Data },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "slide12 updated successfully",
        data: updatedProposal,
      });
    } catch (error) {
      console.error("Error in updateslide12:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getslide12: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(
        proposalId,
        "pitchDocument.slide12 "
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      const slide12 = proposal.pitchDocument?.slide12 || {};

      // Transform categories Map back to object format
      const categories = {};
      if (slide12.ebitda_basedSchema?.categories) {
        for (const [
          key,
          data,
        ] of slide12.ebitda_basedSchema.categories.entries()) {
          categories[key] = data.value;
        }
      }

      // Transform existingStake Map back to object
      const existingStake = {};
      if (slide12.existingStake) {
        for (const [key, value] of slide12.existingStake.entries()) {
          existingStake[key] = value;
        }
      }

      const slide12Data = {
        proposalId: proposal._id,

        slide12: {
          ebitdaMultiple: slide12.ebitdaMultiple,
          externalNetDebt: slide12.externalNetDebt,
          ebitda_basedSchema: {
            categories,
            negativeAdjustments:
              slide12.ebitda_basedSchema?.negativeAdjustments || "",
            positiveAdjustments:
              slide12.ebitda_basedSchema?.positiveAdjustments || "",
          },
          existingStake,
          seriesAnotes: slide12.seriesAnotes || "",
        },
      };

      res.status(200).json({
        status: true,
        data: slide12Data,
      });
    } catch (error) {
      console.error("Error in getSlide12:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  // Update and Get functions for Slide 12
  updateslide13: async (req, res) => {
    try {
      const { proposalId, contentPairs } = req.body;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const slide13Data = {
        "pitchDocument.slide13": {
          contentPairs: contentPairs || [],
        },
      };

      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { $set: slide13Data },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "slide13 updated successfully",
        data: updatedProposal,
      });
    } catch (error) {
      console.error("Error in updateslide13:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getslide13: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(
        proposalId,
        "pitchDocument.slide13"
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      const slide13Data = {
        proposalId: proposal._id,

        slide13: proposal.pitchDocument?.slide13 || {},
      };

      res.status(200).json({
        status: true,
        data: slide13Data,
      });
    } catch (error) {
      console.error("Error in getSlide13:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  // Update and Get functions for Slide 13
  updateslide14: async (req, res) => {
    try {
      const {
        proposalId,
        name_final,
        description_final,
        ph_no,
        mail,
        image, // Add image to destructuring
      } = req.body;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const slide14Data = {
        "pitchDocument.slide14": {
          name_final: name_final || "",
          description_final: description_final || "",
          ph_no: ph_no || "",
          mail: mail || "",
          image: {
            // Add image data
            type: image?.type || "",
            file: image?.file || "",
          },
        },
      };

      const updatedProposal = await BusinessProposal.findByIdAndUpdate(
        proposalId,
        { $set: slide14Data },
        { new: true }
      );

      if (!updatedProposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "slide14 updated successfully",
        data: updatedProposal,
      });
    } catch (error) {
      console.error("Error in updateslide14:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  getslide14: async (req, res) => {
    try {
      const { proposalId } = req.params;

      if (!proposalId) {
        return res.status(400).json({
          status: false,
          message: "Proposal ID is required",
        });
      }

      const proposal = await BusinessProposal.findById(
        proposalId,
        "pitchDocument.slide14"
      );

      if (!proposal) {
        return res.status(404).json({
          status: false,
          message: "Business proposal not found",
        });
      }

      const slide14Data = {
        proposalId: proposal._id,

        slide14: proposal.pitchDocument?.slide14 || {},
      };

      res.status(200).json({
        status: true,
        data: slide14Data,
      });
    } catch (error) {
      console.error("Error in getSlide14:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },
};
