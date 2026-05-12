export default function PipLogo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pipLogo" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1"/>
          <stop offset="1" stopColor="#a855f7"/>
        </linearGradient>
      </defs>
      <path d="M4 16L8 4L13.5 13.5Z" fill="url(#pipLogo)"/>
      <path d="M26 16L22 4L16.5 13.5Z" fill="url(#pipLogo)"/>
      <circle cx="15" cy="19" r="10" fill="url(#pipLogo)"/>
      <ellipse cx="11.5" cy="17" rx="2" ry="1.6" fill="white" opacity="0.92"/>
      <ellipse cx="18.5" cy="17" rx="2" ry="1.6" fill="white" opacity="0.92"/>
      <polyline points="8,23 10.5,21.5 13,22.5 16,20 19,21 22,18.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/>
    </svg>
  );
}
