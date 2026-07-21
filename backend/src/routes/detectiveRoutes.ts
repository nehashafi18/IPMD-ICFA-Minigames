import express, { Router } from 'express';
import {
  generateSceneController,
  getSceneImageController,
  getTileController,
  getManifestController,
  getObjectsController,
} from '../controllers/detectiveController.js';

const router: Router = express.Router();

router.post('/generate-scene',              generateSceneController);
router.get('/scene-image/:sceneId',         getSceneImageController);
router.get('/tiles/:sceneId/:z/:tx/:ty',    getTileController);
router.get('/manifest/:sceneId',            getManifestController);
router.get('/objects/:sceneId',             getObjectsController);

export default router;
