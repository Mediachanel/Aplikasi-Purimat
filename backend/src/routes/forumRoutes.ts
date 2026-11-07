import { Router } from 'express';
import {
  getAllPosts,
  createPost,
  likePost,
  getCommentsForPost,
  addComment
} from '../controllers/forumController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.get('/posts', authenticateToken, getAllPosts);
router.post('/posts', authenticateToken, createPost);
router.post('/posts/:id/like', authenticateToken, likePost);
router.get('/posts/:id/comments', authenticateToken, getCommentsForPost);
router.post('/posts/:id/comments', authenticateToken, addComment);

export default router;
