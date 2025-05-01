const Investor = require('../models/investorSide.model');

exports.investorController = {
    createInvestorDetails: async (req, res) => {
        try {
            const {
                userId,
                fullName,
                email,
                mobileNo,
                entity_name,
                entity_designation,
                interested_industries,
                investment_size_pref_min,
                investment_size_pref_max,
                open_to,
                Location,
                industries,
                no_deals,
                investment_size_his_min,
                investment_size_his_max,
                prof_desc,
                expectations,
                payment_done_from_owner
            } = req.body;

            // Create new investor with validated data
            const investor = await Investor.create({
                userId,
                fullName,
                email,
                mobileNo,
                entity_name: entity_name || '',
                entity_designation: entity_designation || '',
                interested_industries: interested_industries || [],
                investment_size_pref_min: investment_size_pref_min || '',
                investment_size_pref_max: investment_size_pref_max || '',
                open_to: open_to || [],
                Location: Location || [],
                industries: industries || [],
                no_deals: no_deals || '',
                investment_size_his_min: investment_size_his_min || '',
                investment_size_his_max: investment_size_his_max || '',
                prof_desc: prof_desc || '',
                expectations: expectations || '',
                payment_done_from_owner: payment_done_from_owner || []
            });

            res.status(201).json({
                status: true,
                message: "Investor details created successfully",
                data: investor
            });
        } catch (error) {
            console.error("Create Investor Error:", error);
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    },

    updateInvestorDetails: async (req, res) => {
        try {
            const { investorId, ...updateData } = req.body;

            if (!investorId) {
                return res.status(400).json({
                    status: false,
                    message: "Investor ID is required"
                });
            }

            // Handle array fields to ensure they remain arrays even if empty
            const arrayFields = ['interested_industries', 'open_to', 'Location', 'industries'];
            arrayFields.forEach(field => {
                if (field in updateData && !Array.isArray(updateData[field])) {
                    updateData[field] = updateData[field] ? [updateData[field]] : [];
                }
            });

            const investor = await Investor.findByIdAndUpdate(
                investorId,
                updateData,
                { new: true, runValidators: true }
            );

            if (!investor) {
                return res.status(404).json({
                    status: false,
                    message: "Investor not found"
                });
            }

            res.status(200).json({
                status: true,
                message: "Investor details updated successfully",
                data: investor
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    },
    updatePaymentStatus: async (req, res) => {
        try {
            const { investorId, proposalId, payment_done_from_owner_status } = req.body;

            if (!investorId || !proposalId) {
                return res.status(400).json({
                    status: false,
                    message: "Investor ID and Proposal ID are required"
                });
            }

            const investor = await Investor.findById(investorId);

            if (!investor) {
                return res.status(404).json({
                    status: false,
                    message: "Investor not found"
                });
            }

            // Find if payment entry exists for this proposal
            const paymentIndex = investor.payment_done_from_owner.findIndex(
                payment => payment.proposalId.toString() === proposalId
            );

            if (paymentIndex === -1) {
                // Add new payment entry
                investor.payment_done_from_owner.push({
                    proposalId,
                    payment_done_from_owner_status: Boolean(payment_done_from_owner_status)
                });
            } else {
                // Update existing payment entry
                investor.payment_done_from_owner[paymentIndex].payment_done_from_owner_status = 
                    Boolean(payment_done_from_owner_status);
            }

            await investor.save();

            res.status(200).json({
                status: true,
                message: "Payment status updated successfully",
                data: investor
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    },

    // Keep getInvestorDetailsByID, deleteInvestorDetails, and getAllInvestors unchanged
    getInvestorDetailsByID: async (req, res) => {
        try {
            const { investorId } = req.params;

            if (!investorId) {
                return res.status(400).json({
                    status: false,
                    message: "Investor ID is required"
                });
            }

            const investor = await Investor.findById(investorId);
            
            if (!investor) {
                return res.status(404).json({
                    status: false,
                    message: "Investor not found"
                });
            }

            res.status(200).json({
                status: true,
                data: investor
            });
        } catch (error) {
            console.error("Get Investor Error:", error);
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    },

    deleteInvestorDetails: async (req, res) => {
        try {
            const { investorId } = req.body;

            if (!investorId) {
                return res.status(400).json({
                    status: false,
                    message: "Investor ID is required"
                });
            }

            const investor = await Investor.findByIdAndDelete(investorId);
            
            if (!investor) {
                return res.status(404).json({
                    status: false,
                    message: "Investor not found"
                });
            }

            res.status(200).json({
                status: true,
                message: "Investor details deleted successfully"
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    },

    getAllInvestors: async (req, res) => {
        try {
            const { userId } = req.body;
            const query = userId ? { userId } : {};
            const investors = await Investor.find(query);

            res.status(200).json({
                status: true,
                data: investors,
            });
        } catch (error) {
            console.error("Error in getAllInvestors:", error);
            res.status(500).json({
                status: false,
                message: error.message,
            });
        }
    }
};