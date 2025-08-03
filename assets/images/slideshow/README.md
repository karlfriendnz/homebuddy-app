# Slideshow Images

This directory contains the images for the HomeBuddy login slideshow.

## Image Requirements

- **Format**: PNG, JPG, or WebP
- **Aspect Ratio**: 4:3 or 3:4 (portrait orientation works best)
- **Resolution**: At least 800x1200px for good quality
- **File Size**: Keep under 2MB per image for fast loading

## Current Images

1. **slideshow-1.png** - Plant care image (people tending to plants)
2. **slideshow-2.png** - Family organizing home
3. **slideshow-3.png** - Clean, organized kitchen
4. **slideshow-4.png** - Family planning together

## How to Add Your Images

1. Place your image files in this directory
2. Update the `slideshowImages` array in `app/(auth)/login.tsx`
3. Replace the Unsplash URLs with local image imports

## Example Usage

```typescript
import slideshow1 from '../../assets/images/slideshow/slide1.jpg';
import slideshow2 from '../../assets/images/slideshow/slide2.jpg';
import slideshow3 from '../../assets/images/slideshow/slide3.jpg';
import slideshow4 from '../../assets/images/slideshow/slide4.jpg';

const slideshowImages = [
  slideshow1,
  slideshow2,
  slideshow3,
  slideshow4,
];
``` 