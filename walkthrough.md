# FAQ System Walkthrough

I have successfully updated the header structure and font formatting for the FAQ system layout, and made the marquee title font consistent.

## Changes Made

### 1. Marquee Section Heading Font Match (`TiltedProductMarquee.jsx`)
- **Discover Trending Products Heading**: Changed the heading styling in [TiltedProductMarquee.jsx](file:///c:/Users/razak/Main%20Projects/China-Unique-Main-1.0-stable-original/src/components/TiltedProductMarquee.jsx#L109) from `font-extrabold` to `font-bold tracking-tight` to match the brand heading weight of the other store pages.

### 2. Home Page FAQ Section (`HomeFaqSection.jsx`)
- **Centered Layout**: Removed the grid structure and columns entirely on PC. The section header, Accordion, and CTA button are centered and constrained inside a clean `max-w-4xl` (~896px) width.
- **Removed SVG on PC**: The `/undraw_questions_52ic.svg` illustration has been removed from PC view completely, keeping the front page lightweight and professional.
- **SVG on Mobile**: Retains the SVG centered cleanly above the Accordion.
- **Website Heading Font Match**: Updated the section title to `font-bold tracking-tight`.

### 3. Dedicated FAQ Page (`FaqPageClient.jsx`)
- **Desktop Grid (PC)**: Split 12-column layout with the SVG illustration on the left (first column) and the heading text on the right (second column).
- **Mobile Grid**: Stacks cleanly with text on top and the SVG below.
- **Wider FAQ Width**: Constrained search panel and Accordion items to `max-w-4xl` (~896px) on PC to look spacious.
- **Website Heading Font Match**: Changed the `h1` element font class from `font-extrabold` to `font-bold` and kept `tracking-tight`.

## Verification & Testing
- **Next.js compilation**: The production build compiles cleanly without errors or warnings.
