// routes/audit_routes.js
import express from 'express';
import { authenticate } from '../utils/auth_middleware.js';
import * as AuditService from '../services/audit_service.js';

const router = express.Router();

/**
 * GET /api/audits/hazard/:reportId
 * Get complete audit history for a specific hazard
 */
router.get('/hazard/:reportId', authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch audit history
    const history = await AuditService.getHazardAuditHistory(reportId);

    return res.status(200).json({
      message: '✅ Audit history retrieved successfully',
      history,
      count: history.length
    });
  } catch (error) {
    console.error('[Audit API] Error fetching hazard audit history:', error);
    return res.status(500).json({
      error: 'Failed to fetch audit history',
      details: error.message
    });
  }
});

/**
 * GET /api/audits/user
 * Get audit history for the authenticated user's hazards
 */
router.get('/user', authenticate, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get limit from query param (default 50, max 200)
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    // Fetch user's audit history
    const history = await AuditService.getUserAuditHistory(userId, limit);

    return res.status(200).json({
      message: '✅ User audit history retrieved successfully',
      history,
      count: history.length,
      limit
    });
  } catch (error) {
    console.error('[Audit API] Error fetching user audit history:', error);
    return res.status(500).json({
      error: 'Failed to fetch user audit history',
      details: error.message
    });
  }
});

export default router;
