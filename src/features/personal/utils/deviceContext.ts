// [PERSONAL] Device-aware context detection (viewport & pointer capability) and recommendations
import { DeviceSuggestion, DeviceType } from '../types';

export function detectDeviceContext(): {
  deviceType: DeviceType;
  isTouch: boolean;
  isSmallScreen: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'desktop',
      isTouch: false,
      isSmallScreen: false,
    };
  }

  const width = window.innerWidth;
  const isTouch =
    window.matchMedia('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0;
  const isSmallScreen = width < 640;

  let deviceType: DeviceType = 'desktop';
  if (width < 640) {
    deviceType = 'phone';
  } else if (width < 1024 && isTouch) {
    deviceType = 'tablet';
  } else if (width < 1280) {
    deviceType = 'laptop';
  } else {
    deviceType = 'desktop';
  }

  return { deviceType, isTouch, isSmallScreen };
}

export function getDeviceAwareSuggestion(deviceType: DeviceType): DeviceSuggestion {
  if (deviceType === 'phone') {
    return {
      deviceType: 'phone',
      title: 'Mobile On-The-Go Flow',
      description:
        'Touchscreen detected. Quick bite-sized flashcard reviews and hands-free commute listening are optimized for your phone screen.',
      actionText: 'Study Flashcards',
      actionHref: '/learn',
      actionEvent: 'thinklet:open-commute',
      icon: '📱',
    };
  }

  if (deviceType === 'tablet') {
    return {
      deviceType: 'tablet',
      title: 'Tablet Focus Flow',
      description:
        'Versatile touch display detected. Great for interactive diagnostic quizzes and mind-map diagram reviews.',
      actionText: 'Take Diagnostic Quiz',
      actionHref: '/quiz',
      icon: '📋',
    };
  }

  // Laptop / Desktop
  return {
    deviceType: 'laptop',
    title: 'Deep Desktop Study Workspace',
    description:
      'High-resolution screen and precision keyboard detected. Ideal for full timed practice exam papers, structured notes, and essay writing.',
    actionText: 'Practice Exam Papers',
    actionHref: '/paper',
    icon: '💻',
  };
}
