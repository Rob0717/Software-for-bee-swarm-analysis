import {diskStorage} from 'multer';
import {extname} from 'path';
import {v4 as uuidv4} from 'uuid';
import {Request} from 'express';
import {BadRequestException} from '@nestjs/common';
import * as fs from 'fs';
import {MulterOptions} from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

/**
 * Multer configuration for handling swarm report photo uploads.
 * Files are stored on disk under `./uploads/reports/` with a UUID-based filename.
 * Only image files are accepted, with a maximum size of 10 MB.
 */
export const multerConfig: MulterOptions = {
  storage: diskStorage({
    /**
     * Resolves the upload destination directory.
     * Creates the directory recursively if it does not already exist.
     */
    destination: (_req, _file, cb) => {
      const uploadPath = './uploads/reports';

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, {recursive: true});
      }

      cb(null, uploadPath);
    },

    /**
     * Generates a unique filename for each uploaded file.
     * Uses UUID v4 combined with the original file extension to prevent collisions.
     */
    filename: (_req: Request, file: Express.Multer.File, cb) => {
      const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),

  /**
   * Validates the MIME type of the uploaded file.
   * Rejects files that are not images with a BadRequestException.
   */
  fileFilter: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new BadRequestException('Only image files (jpg, jpeg, png, gif, webp) are allowed!'),
        false,
      );
    }

    cb(null, true);
  },

  limits: {
    /** Maximum allowed file size in bytes (10 MB). */
    fileSize: 10 * 1000 * 1000,
  },
};