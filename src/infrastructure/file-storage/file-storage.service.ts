import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface FileUploadResult {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  url: string;
  path: string;
}

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly uploadPath: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadPath = this.configService.get('UPLOAD_PATH', './uploads');
    this.baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    
    // Ensure upload directory exists
    this.ensureUploadDirectoryExists();
  }

  async uploadFile(file: Express.Multer.File, subDirectory?: string): Promise<FileUploadResult> {
    try {
      // 파일 정보 로깅
      this.logger.log(`Uploading file: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`);
      
      if (!file.buffer || file.buffer.length === 0) {
        throw new Error('File buffer is empty or undefined');
      }

      const fileName = this.generateFileName(file.originalname);
      const directory = subDirectory ? path.join(this.uploadPath, subDirectory) : this.uploadPath;
      
      this.logger.log(`Target directory: ${directory}`);
      this.logger.log(`Generated filename: ${fileName}`);
      
      // Ensure subdirectory exists
      if (!fs.existsSync(directory)) {
        this.logger.log(`Creating directory: ${directory}`);
        fs.mkdirSync(directory, { recursive: true });
      }

      const filePath = path.join(directory, fileName);
      this.logger.log(`Full file path: ${filePath}`);
      
      // Write file to disk
      fs.writeFileSync(filePath, file.buffer);
      
      // 파일이 실제로 생성되었는지 확인
      if (!fs.existsSync(filePath)) {
        throw new Error(`File was not created at path: ${filePath}`);
      }

      const url = this.buildFileUrl(fileName, subDirectory);
      this.logger.log(`Generated URL: ${url}`);

      this.logger.log(`File uploaded successfully: ${fileName}`);

      return {
        filename: fileName,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url,
        path: filePath,
      };
    } catch (error) {
      this.logger.error('Error uploading file:', {
        originalError: error.message,
        stack: error.stack,
        fileName: file?.originalname,
        fileSize: file?.size,
        mimetype: file?.mimetype,
        uploadPath: this.uploadPath,
        subDirectory
      });
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async uploadMultipleFiles(files: Express.Multer.File[], subDirectory?: string): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = [];
    
    for (const file of files) {
      const result = await this.uploadFile(file, subDirectory);
      results.push(result);
    }
    
    return results;
  }

  async deleteFile(filename: string, subDirectory?: string): Promise<boolean> {
    try {
      const directory = subDirectory ? path.join(this.uploadPath, subDirectory) : this.uploadPath;
      const filePath = path.join(directory, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`File deleted successfully: ${filename}`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error('Error deleting file:', error);
      return false;
    }
  }

  getFileUrl(filename: string, subDirectory?: string): string {
    return this.buildFileUrl(filename, subDirectory);
  }

  validateImageFile(file: Express.Multer.File): boolean {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    return true;
  }

  private ensureUploadDirectoryExists(): void {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadPath}`);
    }
  }

  private generateFileName(originalName: string): string {
    const extension = path.extname(originalName);
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0]; // Use first part of UUID for shorter name
    
    return `${timestamp}_${uuid}${extension}`;
  }

  private buildFileUrl(filename: string, subDirectory?: string): string {
    const relativePath = subDirectory ? `${subDirectory}/${filename}` : filename;
    return `${this.baseUrl}/uploads/${relativePath}`;
  }
}
