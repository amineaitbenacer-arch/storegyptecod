'use client';

import antichocBody from '../../antichocBody';

export default function AntichocMarkup() {
  return (
    <div
      id="antichoc-root"
      className="ac-root"
      dangerouslySetInnerHTML={{ __html: antichocBody }}
    />
  );
}
