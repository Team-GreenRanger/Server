import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileStorageService } from '../../infrastructure/file-storage/file-storage.service';
import { FileUploadResponseDto, MultipleFileUploadResponseDto } from '../../application/upload/dto/upload.dto';

@ApiTags('File Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly fileStorageService: FileStorageService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload single image file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: FileUploadResponseDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<FileUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate image file
    this.fileStorageService.validateImageFile(file);

    const result = await this.fileStorageService.uploadFile(file, 'images');

    return {
      filename: result.filename,
      originalName: result.originalName,
      size: result.size,
      mimetype: result.mimetype,
      url: result.url,
    };
  }

  @Post('mission-images')
  @ApiOperation({ summary: 'Upload multiple mission evidence images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Multiple image files upload for mission evidence',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Images uploaded successfully',
    type: MultipleFileUploadResponseDto,
  })
  @UseInterceptors(FilesInterceptor('files', 5)) // Max 5 files
  async uploadMissionImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<MultipleFileUploadResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 5) {
      throw new BadRequestException('Maximum 5 files allowed');
    }

    // Validate all files
    files.forEach(file => this.fileStorageService.validateImageFile(file));

    const results = await this.fileStorageService.uploadMultipleFiles(files, 'missions');

    return {
      files: results.map(result => ({
        filename: result.filename,
        originalName: result.originalName,
        size: result.size,
        mimetype: result.mimetype,
        url: result.url,
      })),
      count: results.length,
    };
  }

  @Post('profile-image')
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Profile image upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Profile image uploaded successfully',
    type: FileUploadResponseDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(@UploadedFile() file: Express.Multer.File): Promise<FileUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate image file
    this.fileStorageService.validateImageFile(file);

    const result = await this.fileStorageService.uploadFile(file, 'profiles');

    return {
      filename: result.filename,
      originalName: result.originalName,
      size: result.size,
      mimetype: result.mimetype,
      url: result.url,
    };
  }
}
