'use client';

import antichocBody from '../../antichocBody';

const optimizedAntichocBody = antichocBody
  .replace(/<img(?![^>]*\bloading=)(?![^>]*\bid="hero-main-img")/g, '<img loading="lazy" decoding="async"')
  .replace(
    '<img src="/images/hero_father_daughter.jpg" id="hero-main-img"',
    '<img src="/images/hero_father_daughter.jpg" id="hero-main-img" fetchpriority="high" decoding="async"'
  );

export default function AntichocMarkup() {
  return (
    <div
      id="antichoc-root"
      className="ac-root"
      dangerouslySetInnerHTML={{ __html: optimizedAntichocBody }}
    />
  );
}
