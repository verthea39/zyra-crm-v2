import React from "react";
import { Svg, Path, Circle, Rect } from "@react-pdf/renderer";

const strokeColor = "#b68d40";

export const PhoneIcon = () => (
  <Svg viewBox="0 0 24 24" width={10} height={10}>
    <Path fill="none" stroke={strokeColor} strokeWidth={2} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

export const MailIcon = () => (
  <Svg viewBox="0 0 24 24" width={10} height={10}>
    <Path fill="none" stroke={strokeColor} strokeWidth={2} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <Path fill="none" stroke={strokeColor} strokeWidth={2} d="m22 6-10 7L2 6" />
  </Svg>
);

export const GlobeIcon = () => (
  <Svg viewBox="0 0 24 24" width={10} height={10}>
    <Circle fill="none" stroke={strokeColor} strokeWidth={2} cx="12" cy="12" r="10" />
    <Path fill="none" stroke={strokeColor} strokeWidth={2} d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    <Path fill="none" stroke={strokeColor} strokeWidth={2} d="M2 12h20" />
  </Svg>
);

export const MapPinIcon = () => (
  <Svg viewBox="0 0 24 24" width={10} height={10}>
    <Path fill="none" stroke={strokeColor} strokeWidth={2} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Circle fill="none" stroke={strokeColor} strokeWidth={2} cx="12" cy="10" r="3" />
  </Svg>
);

export const BuildingIcon = () => (
  <Svg viewBox="0 0 24 24" width={10} height={10}>
    <Path fill="none" stroke={strokeColor} strokeWidth={2} d="M4 2v20M20 2v20M12 22V8M8 22V12M16 22V12M2 22h20" />
  </Svg>
);

export const BriefcaseIcon = () => (
  <Svg viewBox="0 0 24 24" width={10} height={10}>
    <Path fill="none" stroke={strokeColor} strokeWidth={2} d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    <Rect fill="none" stroke={strokeColor} strokeWidth={2} width="20" height="14" x="2" y="6" rx="2" />
  </Svg>
);
