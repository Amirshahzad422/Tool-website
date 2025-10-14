import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const tempDir = join(tmpdir(), "audio-trimmer-" + Date.now());
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const startTime = parseFloat(formData.get("startTime") as string || "0");
    const endTime = parseFloat(formData.get("endTime") as string || "0");
    const middleTrimStart = parseFloat(formData.get("middleTrimStart") as string || "0");
    const middleTrimEnd = parseFloat(formData.get("middleTrimEnd") as string || "0");
    const trimMode = formData.get("trimMode") as string || "start-end";
    const outputFormat = formData.get("outputFormat") as string || "mp3";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
      return NextResponse.json({ 
        error: `File ${file.name} is not a valid audio or video file` 
      }, { status: 400 });
    }

    // Validate trim times
    if (trimMode === 'start-end') {
      if (startTime < 0 || endTime <= startTime) {
        return NextResponse.json({ 
          error: "Invalid trim times. End time must be greater than start time." 
        }, { status: 400 });
      }
    } else if (trimMode === 'middle-remove') {
      if (middleTrimStart < 0 || middleTrimEnd <= middleTrimStart) {
        return NextResponse.json({ 
          error: "Invalid middle trim times. End time must be greater than start time." 
        }, { status: 400 });
      }
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    const inputFileName = `input.${fileExtension}`;
    const inputPath = join(tempDir, inputFileName);
    const outputFile = join(tempDir, `trimmed.${outputFormat}`);

    try {
      // Save uploaded file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      writeFileSync(inputPath, buffer);

      let ffmpegCommand: string;

      if (trimMode === 'start-end') {
        // Regular trimming from start to end
        ffmpegCommand = `ffmpeg -i "${inputPath}"`;
        
        // Add trimming parameters
        if (startTime > 0) {
          ffmpegCommand += ` -ss ${startTime}`;
        }
        
        // Calculate duration
        const duration = endTime - startTime;
        ffmpegCommand += ` -t ${duration}`;

        // Set output format and quality
        switch (outputFormat) {
          case 'mp3':
            ffmpegCommand += ` -c:a libmp3lame -b:a 192k "${outputFile}" -y`;
            break;
          case 'wav':
            ffmpegCommand += ` -c:a pcm_s16le "${outputFile}" -y`;
            break;
          case 'aac':
            ffmpegCommand += ` -c:a aac -b:a 128k "${outputFile}" -y`;
            break;
          case 'ogg':
            ffmpegCommand += ` -c:a libvorbis -q:a 5 "${outputFile}" -y`;
            break;
          case 'flac':
            ffmpegCommand += ` -c:a flac "${outputFile}" -y`;
            break;
          default:
            ffmpegCommand += ` -c:a libmp3lame -b:a 192k "${outputFile}" -y`;
        }

        console.log(`Trimming audio: ${ffmpegCommand}`);
        await execAsync(ffmpegCommand);
      } else {
        // Middle removal: create two segments and merge them
        const segment1Path = join(tempDir, `segment1.${outputFormat}`);
        const segment2Path = join(tempDir, `segment2.${outputFormat}`);
        const concatListPath = join(tempDir, "concat_list.txt");

        // Create first segment (from start to middleTrimStart)
        let segment1Command = `ffmpeg -i "${inputPath}"`;
        if (middleTrimStart > 0) {
          segment1Command += ` -t ${middleTrimStart}`;
        }
        
        switch (outputFormat) {
          case 'mp3':
            segment1Command += ` -c:a libmp3lame -b:a 192k "${segment1Path}" -y`;
            break;
          case 'wav':
            segment1Command += ` -c:a pcm_s16le "${segment1Path}" -y`;
            break;
          case 'aac':
            segment1Command += ` -c:a aac -b:a 128k "${segment1Path}" -y`;
            break;
          case 'ogg':
            segment1Command += ` -c:a libvorbis -q:a 5 "${segment1Path}" -y`;
            break;
          case 'flac':
            segment1Command += ` -c:a flac "${segment1Path}" -y`;
            break;
          default:
            segment1Command += ` -c:a libmp3lame -b:a 192k "${segment1Path}" -y`;
        }

        // Create second segment (from middleTrimEnd to end)
        let segment2Command = `ffmpeg -i "${inputPath}"`;
        segment2Command += ` -ss ${middleTrimEnd}`;
        
        switch (outputFormat) {
          case 'mp3':
            segment2Command += ` -c:a libmp3lame -b:a 192k "${segment2Path}" -y`;
            break;
          case 'wav':
            segment2Command += ` -c:a pcm_s16le "${segment2Path}" -y`;
            break;
          case 'aac':
            segment2Command += ` -c:a aac -b:a 128k "${segment2Path}" -y`;
            break;
          case 'ogg':
            segment2Command += ` -c:a libvorbis -q:a 5 "${segment2Path}" -y`;
            break;
          case 'flac':
            segment2Command += ` -c:a flac "${segment2Path}" -y`;
            break;
          default:
            segment2Command += ` -c:a libmp3lame -b:a 192k "${segment2Path}" -y`;
        }

        console.log(`Creating segment 1: ${segment1Command}`);
        await execAsync(segment1Command);

        console.log(`Creating segment 2: ${segment2Command}`);
        await execAsync(segment2Command);

        // Create concat list
        const concatListContent = `file '${segment1Path}'\nfile '${segment2Path}'`;
        writeFileSync(concatListPath, concatListContent);

        // Merge segments
        const mergeCommand = `ffmpeg -f concat -safe 0 -i "${concatListPath}" -c copy "${outputFile}" -y`;
        console.log(`Merging segments: ${mergeCommand}`);
        await execAsync(mergeCommand);
      }

      if (!existsSync(outputFile)) {
        throw new Error('Audio trimming failed - output file not created');
      }

      const trimmedAudioBuffer = readFileSync(outputFile);

      return new NextResponse(trimmedAudioBuffer, {
        status: 200,
        headers: {
          'Content-Type': `audio/${outputFormat}`,
          'Content-Disposition': `attachment; filename="trimmed_audio.${outputFormat}"`,
        },
      });

    } catch (error) {
      console.error('Audio Trimmer API Error:', error);
      return NextResponse.json({ 
        error: "Failed to trim audio file. " + (error instanceof Error ? error.message : String(error)) 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Audio Trimmer API Error:', error);
    return NextResponse.json({ 
      error: "Failed to process audio file. " + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 });
  } finally {
    // Clean up temporary files and directory
    try {
      if (existsSync(tempDir)) {
        const filesInTempDir = require('fs').readdirSync(tempDir);
        for (const file of filesInTempDir) {
          unlinkSync(join(tempDir, file));
        }
        require('fs').rmdirSync(tempDir);
      }
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError);
    }
  }
}
