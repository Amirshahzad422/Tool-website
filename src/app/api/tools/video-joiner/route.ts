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
  const tempDir = join(tmpdir(), "video-joiner-" + Date.now());
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const orders = formData.getAll("order") as string[];
    const trimmedStarts = formData.getAll("trimmedStart") as string[];
    const trimmedEnds = formData.getAll("trimmedEnd") as string[];
    const isTrimmedFlags = formData.getAll("isTrimmed") as string[];
    const volumes = formData.getAll("volume") as string[];
    const volumeSegments = formData.getAll("volumeSegments") as string[];
    const resolutions = formData.getAll("resolution") as string[];
    const fps = formData.getAll("fps") as string[];
    const transitions = formData.getAll("transition") as string[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const inputFiles: string[] = [];
    const outputFile = join(tempDir, "merged-output.mp4");

    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const order = parseInt(orders[i] || i.toString());
        const trimmedStart = parseFloat(trimmedStarts[i] || "0");
        const trimmedEnd = parseFloat(trimmedEnds[i] || "0");
        const isTrimmed = isTrimmedFlags[i] === "true";
        const volume = parseFloat(volumes[i] || "1.0");
        const volumeSegmentsData = JSON.parse(volumeSegments[i] || "[]");
        const resolution = resolutions[i] || "1920x1080";
        const fpsValue = parseInt(fps[i] || "30");
        const transitionData = JSON.parse(transitions[i] || '{"type":"none","duration":0}');

        // Validate file type
        if (!file.type.startsWith("video/")) {
          return NextResponse.json({ 
            error: `File ${file.name} is not a valid video file` 
          }, { status: 400 });
        }

        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
        const inputFileName = `input_${order}_${i}.${fileExtension}`;
        const inputPath = join(tempDir, inputFileName);

        // Save uploaded file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        writeFileSync(inputPath, buffer);

        // If trimming is needed, create a trimmed version
        if (isTrimmed && (trimmedStart > 0 || trimmedEnd < file.size)) {
          const trimmedFileName = `trimmed_${order}_${i}.mp4`;
          const trimmedPath = join(tempDir, trimmedFileName);

          let ffmpegCommand = `ffmpeg -i "${inputPath}"`;
          
          // Add trimming parameters
          if (trimmedStart > 0) {
            ffmpegCommand += ` -ss ${trimmedStart}`;
          }
          if (trimmedEnd > 0 && trimmedEnd < file.size) {
            ffmpegCommand += ` -t ${trimmedEnd - trimmedStart}`;
          }

          // Apply volume adjustments if needed
          if (volume !== 1.0 || volumeSegmentsData.length > 0) {
            let volumeFilter = `volume=${volume}`;
            
            // Add volume segments if any
            if (volumeSegmentsData.length > 0) {
              const activeSegments = volumeSegmentsData.filter((seg: any) => seg.isActive);
              if (activeSegments.length > 0) {
                // For simplicity, we'll apply the first active segment's volume
                // In a more advanced implementation, you'd create a complex filter
                const firstSegment = activeSegments[0];
                volumeFilter = `volume=${firstSegment.volume}`;
              }
            }
            
            ffmpegCommand += ` -af "${volumeFilter}"`;
          }

          // Output as MP4 with consistent settings
          ffmpegCommand += ` -c:v libx264 -c:a aac -preset medium -crf 23 "${trimmedPath}" -y`;

          console.log(`Trimming file ${i}: ${ffmpegCommand}`);
          await execAsync(ffmpegCommand);

          if (existsSync(trimmedPath)) {
            inputFiles.push(trimmedPath);
          } else {
            inputFiles.push(inputPath); // Fallback to original
          }
        } else {
          // Convert to MP4 if needed for consistency
          if (!file.name.toLowerCase().endsWith('.mp4')) {
            const mp4FileName = `converted_${order}_${i}.mp4`;
            const mp4Path = join(tempDir, mp4FileName);

            let ffmpegCommand = `ffmpeg -i "${inputPath}"`;

            // Apply volume adjustments if needed
            if (volume !== 1.0 || volumeSegmentsData.length > 0) {
              let volumeFilter = `volume=${volume}`;
              
              if (volumeSegmentsData.length > 0) {
                const activeSegments = volumeSegmentsData.filter((seg: any) => seg.isActive);
                if (activeSegments.length > 0) {
                  const firstSegment = activeSegments[0];
                  volumeFilter = `volume=${firstSegment.volume}`;
                }
              }
              
              ffmpegCommand += ` -af "${volumeFilter}"`;
            }

            // Output as MP4 with consistent settings
            ffmpegCommand += ` -c:v libx264 -c:a aac -preset medium -crf 23 "${mp4Path}" -y`;

            console.log(`Converting file ${i}: ${ffmpegCommand}`);
            await execAsync(ffmpegCommand);

            if (existsSync(mp4Path)) {
              inputFiles.push(mp4Path);
            } else {
              inputFiles.push(inputPath); // Fallback to original
            }
          } else {
            // Apply volume adjustment to existing MP4 files
            if (volume !== 1.0 || volumeSegmentsData.length > 0) {
              const volumeAdjustedFileName = `volume_${order}_${i}.mp4`;
              const volumeAdjustedPath = join(tempDir, volumeAdjustedFileName);
              
              let volumeFilter = `volume=${volume}`;
              
              if (volumeSegmentsData.length > 0) {
                const activeSegments = volumeSegmentsData.filter((seg: any) => seg.isActive);
                if (activeSegments.length > 0) {
                  const firstSegment = activeSegments[0];
                  volumeFilter = `volume=${firstSegment.volume}`;
                }
              }
              
              const ffmpegCommand = `ffmpeg -i "${inputPath}" -af "${volumeFilter}" "${volumeAdjustedPath}" -y`;
              
              console.log(`Adjusting volume for file ${i}: ${ffmpegCommand}`);
              await execAsync(ffmpegCommand);
              
              if (existsSync(volumeAdjustedPath)) {
                inputFiles.push(volumeAdjustedPath);
              } else {
                inputFiles.push(inputPath); // Fallback to original
              }
            } else {
              inputFiles.push(inputPath);
            }
          }
        }
      }

      // Sort files by order
      const sortedFiles = inputFiles.sort((a, b) => {
        const aOrder = parseInt(a.split('_')[1]);
        const bOrder = parseInt(b.split('_')[1]);
        return aOrder - bOrder;
      });

      // Create concat file list
      const concatListPath = join(tempDir, "concat_list.txt");
      const concatListContent = sortedFiles.map(file => `file '${file}'`).join('\n');
      writeFileSync(concatListPath, concatListContent);

      // Merge videos using concat demuxer with re-encoding for compatibility
      const ffmpegMergeCommand = `ffmpeg -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -c:a aac -preset medium -crf 23 "${outputFile}" -y`;

      console.log(`Merging videos: ${ffmpegMergeCommand}`);
      await execAsync(ffmpegMergeCommand);

      if (!existsSync(outputFile)) {
        throw new Error('Video merging failed - output file not created');
      }

      const mergedVideoBuffer = readFileSync(outputFile);

      return new NextResponse(mergedVideoBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="merged_video.mp4"`,
        },
      });

    } catch (error) {
      console.error('Video Joiner API Error:', error);
      return NextResponse.json({ 
        error: "Failed to process video files. " + (error instanceof Error ? error.message : String(error)) 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Video Joiner API Error:', error);
    return NextResponse.json({ 
      error: "Failed to process video files. " + (error instanceof Error ? error.message : String(error)) 
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
