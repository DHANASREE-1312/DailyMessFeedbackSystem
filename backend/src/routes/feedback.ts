import * as express from 'express';
import { AuthService } from '../auth';
import { getPool } from '../database';

const router = express.Router();

// Submit feedback (authenticated users only)
router.post('/submit', AuthService.authenticateToken, async (req: any, res: any) => {
  try {
    const dbPool = getPool();
    if (!dbPool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const { rating, comment, meal_type, is_anonymous } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    if (!meal_type || !['breakfast', 'lunch', 'dinner'].includes(meal_type)) {
      return res.status(400).json({
        error: 'Meal type must be breakfast, lunch, or dinner'
      });
    }

    // Insert feedback (removed daily submission restriction)
    const today = new Date().toISOString().split('T')[0];
    const result = await dbPool.request()
      .input('userId', is_anonymous ? null : userId)
      .input('rating', rating)
      .input('comment', comment || null)
      .input('isAnonymous', is_anonymous ? 1 : 0)
      .input('mealDate', today)
      .input('mealType', meal_type)
      .query(`
        INSERT INTO Feedback (user_id, rating, comment, is_anonymous, status, meal_date, meal_type)
        OUTPUT INSERTED.*
        VALUES (@userId, @rating, @comment, @isAnonymous, 'pending', @mealDate, @mealType)
      `);

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: result.recordset[0]
    });
  } catch (error: any) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      error: 'Failed to submit feedback'
    });
  }
});

// Get user's feedback history
router.get('/history', AuthService.authenticateToken, async (req: any, res: any) => {
  try {
    const dbPool = getPool();
    if (!dbPool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const userId = req.user.userId;
    const { limit = 10, offset = 0 } = req.query;

    // Get feedback with grouped dishes
    const result = await dbPool.request()
      .input('userId', userId)
      .input('limit', parseInt(limit as string))
      .input('offset', parseInt(offset as string))
      .query(`
        SELECT 
          f.id,
          f.rating,
          f.comment,
          f.meal_date,
          f.meal_type,
          f.status,
          f.created_at,
          f.is_anonymous,
          STRING_AGG(m.dish_name, ', ') as dish_names
        FROM Feedback f
        LEFT JOIN Menu m ON f.meal_date = m.meal_date AND f.meal_type = m.meal_type
        WHERE f.user_id = @userId
        GROUP BY f.id, f.rating, f.comment, f.meal_date, f.meal_type, f.status, f.created_at, f.is_anonymous
        ORDER BY f.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    res.json({
      feedback: result.recordset,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        count: result.recordset.length
      }
    });
  } catch (error: any) {
    console.error('Get feedback history error:', error);
    res.status(500).json({
      error: 'Failed to get feedback history'
    });
  }
});

// Get today's menu
router.get('/menu/today', async (req: any, res: any) => {
  try {
    const dbPool = getPool();
    if (!dbPool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const today = new Date().toISOString().split('T')[0];

    const result = await dbPool.request()
      .input('mealDate', today)
      .query(`
        SELECT meal_type, dish_name, description
        FROM Menu
        WHERE meal_date = @mealDate
        ORDER BY
          CASE meal_type
            WHEN 'breakfast' THEN 1
            WHEN 'lunch' THEN 2
            WHEN 'dinner' THEN 3
          END
      `);

    const menu = {
      date: today,
      meals: result.recordset.reduce((acc: any, item: any) => {
        if (!acc[item.meal_type]) {
          acc[item.meal_type] = [];
        }
        acc[item.meal_type].push({
          dish_name: item.dish_name,
          description: item.description
        });
        return acc;
      }, {})
    };

    res.json(menu);
  } catch (error: any) {
    console.error('Get today menu error:', error);
    res.status(500).json({
      error: 'Failed to get today\'s menu'
    });
  }
});

// Admin: Get all feedback (admin only)
router.get('/admin/all', AuthService.authenticateToken, AuthService.requireAdmin, async (req: any, res: any) => {
  try {
    const dbPool = getPool();
    if (!dbPool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const { date_from, date_to, rating, meal_type, status, limit = 50, offset = 0 } = req.query;

    let whereClause = '1=1';
    const inputs: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    if (date_from) {
      whereClause += ' AND f.meal_date >= @dateFrom';
      inputs.dateFrom = date_from;
    }

    if (date_to) {
      whereClause += ' AND f.meal_date <= @dateTo';
      inputs.dateTo = date_to;
    }

    if (rating) {
      whereClause += ' AND f.rating = @rating';
      inputs.rating = parseInt(rating as string);
    }

    if (meal_type) {
      whereClause += ' AND f.meal_type = @mealType';
      inputs.mealType = meal_type;
    }

    if (status) {
      whereClause += ' AND f.status = @status';
      inputs.status = status;
    }

    const result = await dbPool.request()
      .input('limit', inputs.limit)
      .input('offset', inputs.offset);

    if (inputs.dateFrom) result.input('dateFrom', inputs.dateFrom);
    if (inputs.dateTo) result.input('dateTo', inputs.dateTo);
    if (inputs.rating) result.input('rating', inputs.rating);
    if (inputs.mealType) result.input('mealType', inputs.mealType);
    if (inputs.status) result.input('status', inputs.status);

    const feedbackResult = await result.query(`
      SELECT 
        f.id,
        f.user_id,
        f.rating,
        f.comment,
        f.meal_date,
        f.meal_type,
        f.status,
        f.created_at,
        f.is_anonymous,
        u.username,
        u.email,
        STRING_AGG(m.dish_name, ', ') as dish_names
      FROM Feedback f
      LEFT JOIN Users u ON f.user_id = u.id
      LEFT JOIN Menu m ON f.meal_date = m.meal_date AND f.meal_type = m.meal_type
      WHERE ${whereClause}
      GROUP BY f.id, f.user_id, f.rating, f.comment, f.meal_date, f.meal_type, f.status, f.created_at, f.is_anonymous, u.username, u.email
      ORDER BY f.created_at DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

    res.json({
      feedback: feedbackResult.recordset,
      pagination: {
        limit: inputs.limit,
        offset: inputs.offset,
        count: feedbackResult.recordset.length
      }
    });
  } catch (error: any) {
    console.error('Get all feedback error:', error);
    res.status(500).json({
      error: 'Failed to get feedback data'
    });
  }
});

// Admin: Get feedback statistics
router.get('/admin/stats', AuthService.authenticateToken, AuthService.requireAdmin, async (req: any, res: any) => {
  try {
    const dbPool = getPool();
    if (!dbPool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const { date_from, date_to } = req.query;

    let whereClause = '1=1';
    const inputs: any = {};

    if (date_from) {
      whereClause += ' AND meal_date >= @dateFrom';
      inputs.dateFrom = date_from;
    }

    if (date_to) {
      whereClause += ' AND meal_date <= @dateTo';
      inputs.dateTo = date_to;
    }

    const result = await dbPool.request();
    if (inputs.dateFrom) result.input('dateFrom', inputs.dateFrom);
    if (inputs.dateTo) result.input('dateTo', inputs.dateTo);

    const statsResult = await result.query(`
      SELECT
        COUNT(*) as total_feedback,
        AVG(CAST(rating AS FLOAT)) as avg_rating,
        MIN(rating) as min_rating,
        MAX(rating) as max_rating,
        COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_feedback,
        COUNT(DISTINCT meal_date) as days_covered
      FROM Feedback
      WHERE ${whereClause}
    `);

    const mealTypeStats = await result.query(`
      SELECT
        meal_type,
        COUNT(*) as count,
        AVG(CAST(rating AS FLOAT)) as avg_rating
      FROM Feedback
      WHERE ${whereClause}
      GROUP BY meal_type
      ORDER BY meal_type
    `);

    res.json({
      overall: statsResult.recordset[0],
      by_meal_type: mealTypeStats.recordset
    });
  } catch (error: any) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      error: 'Failed to get feedback statistics'
    });
  }
});

// Admin: Export feedback data as CSV (admin only)
router.get('/admin/export', AuthService.authenticateToken, AuthService.requireAdmin, async (req: any, res: any) => {
  try {
    const dbPool = getPool();
    if (!dbPool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const { date_from, date_to, rating, meal_type, status } = req.query;

    let whereClause = '1=1';
    const inputs: any = {};

    if (date_from) {
      whereClause += ' AND f.meal_date >= @dateFrom';
      inputs.dateFrom = date_from;
    }

    if (date_to) {
      whereClause += ' AND f.meal_date <= @dateTo';
      inputs.dateTo = date_to;
    }

    if (rating) {
      whereClause += ' AND f.rating = @rating';
      inputs.rating = parseInt(rating as string);
    }

    if (meal_type) {
      whereClause += ' AND f.meal_type = @mealType';
      inputs.mealType = meal_type;
    }

    if (status) {
      whereClause += ' AND f.status = @status';
      inputs.status = status;
    }

    const result = await dbPool.request();
    if (inputs.dateFrom) result.input('dateFrom', inputs.dateFrom);
    if (inputs.dateTo) result.input('dateTo', inputs.dateTo);
    if (inputs.rating) result.input('rating', inputs.rating);
    if (inputs.mealType) result.input('mealType', inputs.mealType);
    if (inputs.status) result.input('status', inputs.status);

    const feedbackResult = await result.query(`
      SELECT 
        f.id,
        f.user_id,
        f.rating,
        f.comment,
        f.meal_date,
        f.meal_type,
        f.status,
        f.created_at,
        f.is_anonymous,
        u.username,
        u.email,
        STRING_AGG(m.dish_name, ', ') as dish_names
      FROM Feedback f
      LEFT JOIN Users u ON f.user_id = u.id
      LEFT JOIN Menu m ON f.meal_date = m.meal_date AND f.meal_type = m.meal_type
      WHERE ${whereClause}
      GROUP BY f.id, f.user_id, f.rating, f.comment, f.meal_date, f.meal_type, f.status, f.created_at, f.is_anonymous, u.username, u.email
      ORDER BY f.created_at DESC
    `);

    // Create CSV headers
    const headers = ['ID', 'Date', 'Meal Type', 'Rating', 'Comment', 'User', 'Dishes', 'Anonymous', 'Status', 'Created At'];
    
    // Create CSV rows
    const csvRows = feedbackResult.recordset.map((item: any) => [
      item.id,
      item.meal_date,
      item.meal_type,
      item.rating,
      item.comment || '',
      item.is_anonymous ? 'Anonymous' : (item.username || item.email || 'Unknown'),
      item.dish_names || '',
      item.is_anonymous ? 'Yes' : 'No',
      item.status || 'pending',
      new Date(item.created_at).toISOString()
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="feedback-export-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csvContent);
  } catch (error: any) {
    console.error('Export feedback error:', error);
    res.status(500).json({
      error: 'Failed to export feedback data'
    });
  }
});

// Admin: Update feedback status (admin only)
router.patch('/:id/status', AuthService.authenticateToken, AuthService.requireAdmin, async (req: any, res: any) => {
  try {
    const dbPool = getPool();
    if (!dbPool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['pending', 'processing', 'resolved'].includes(status)) {
      return res.status(400).json({
        error: 'Status must be pending, processing, or resolved'
      });
    }

    const result = await dbPool.request()
      .input('id', id)
      .input('status', status)
      .query(`
        UPDATE Feedback
        SET status = @status, updated_at = GETDATE()
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({ message: 'Feedback status updated successfully' });
  } catch (error: any) {
    console.error('Update feedback status error:', error);
    res.status(500).json({
      error: 'Failed to update feedback status'
    });
  }
});

// Get daily meal for specific day
router.get('/menu/:day', async (req: any, res: any) => {
  try {
    const dbPool = getPool();
    if (!dbPool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const { day } = req.params;
    const today = new Date();
    const targetDate = new Date(today);

    // Calculate the target day (0 = Sunday, 1 = Monday, etc.)
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = dayNames.indexOf(day.toLowerCase());

    if (dayIndex === -1) {
      return res.status(400).json({ error: 'Invalid day. Use: sunday, monday, tuesday, wednesday, thursday, friday, saturday' });
    }

    // Find the next occurrence of the specified day
    const daysUntilTarget = (dayIndex - today.getDay() + 7) % 7;
    if (daysUntilTarget !== 0) {
      targetDate.setDate(today.getDate() + daysUntilTarget);
    }

    const targetDateStr = targetDate.toISOString().split('T')[0];

    const result = await dbPool.request()
      .input('mealDate', targetDateStr)
      .query(`
        SELECT meal_type, dish_name, description
        FROM Menu
        WHERE meal_date = @mealDate
        ORDER BY
          CASE meal_type
            WHEN 'breakfast' THEN 1
            WHEN 'lunch' THEN 2
            WHEN 'dinner' THEN 3
          END
      `);

    const menu = {
      date: targetDateStr,
      day: day,
      meals: result.recordset.reduce((acc: any, item: any) => {
        if (!acc[item.meal_type]) {
          acc[item.meal_type] = [];
        }
        acc[item.meal_type].push({
          dish_name: item.dish_name,
          description: item.description
        });
        return acc;
      }, {})
    };

    res.json(menu);
  } catch (error: any) {
    console.error('Get daily menu error:', error);
    res.status(500).json({
      error: 'Failed to get daily menu'
    });
  }
});

export default router;
