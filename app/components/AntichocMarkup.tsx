'use client';

import antichocBody from '../antichocBody';

/** Full Antichoc HTML (100% source markup). Interactions via ProductShell. */
export default function AntichocMarkup() {
  return (
    <div
      id="antichoc-root"
      className="ac-root"
      dangerouslySetInnerHTML={{ __html: antichocBody }}
    />
  );
}
