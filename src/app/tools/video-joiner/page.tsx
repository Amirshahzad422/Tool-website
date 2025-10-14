import VideoJoinerClient from './VideoJoinerClient';

export const metadata = {
  title: 'Video Joiner - Merge Multiple Videos | Toolbox',
  description: 'Join and merge multiple video files into one. Professional video editing with trimming, volume control, and transitions.',
  keywords: 'video joiner, video merger, merge videos, video editing, video combiner, mp4 joiner, video tools',
};

export default function VideoJoinerPage() {
  return <VideoJoinerClient />;
}
