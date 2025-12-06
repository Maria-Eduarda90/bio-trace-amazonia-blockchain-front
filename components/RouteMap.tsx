import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { MapCoordinate } from '../types';
import { MapPin, Navigation } from 'lucide-react';

interface RouteMapProps {
  coordinates: MapCoordinate[];
  loading: boolean;
}

const RouteMap: React.FC<RouteMapProps> = ({ coordinates, loading }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const height = 300;

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
        if(containerRef.current) setWidth(containerRef.current.offsetWidth);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const svgContent = useMemo(() => {
    if (loading || coordinates.length === 0 || width === 0) return null;

    // Filter valid lat/lng
    const validCoords = coordinates.filter(c => c.lat != null && c.lng != null);
    if (validCoords.length === 0) return null;

    const lats = validCoords.map(c => c.lat);
    const lngs = validCoords.map(c => c.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add padding (10%)
    const latPad = (maxLat - minLat) * 0.1 || 0.01;
    const lngPad = (maxLng - minLng) * 0.1 || 0.01;

    // D3 Scales
    // Longitude maps to X (width), Latitude maps to Y (height)
    // Note: Lat increases upwards, but SVG Y increases downwards. So range is [height, 0]
    const xScale = d3.scaleLinear()
      .domain([minLng - lngPad, maxLng + lngPad])
      .range([20, width - 20]);

    const yScale = d3.scaleLinear()
      .domain([minLat - latPad, maxLat + latPad])
      .range([height - 20, 20]);

    // Path generator
    const lineGenerator = d3.line<MapCoordinate>()
      .x(d => xScale(d.lng))
      .y(d => yScale(d.lat))
      .curve(d3.curveMonotoneX);

    const pathData = lineGenerator(validCoords) || '';

    return (
      <>
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Path Line */}
        <path
          d={pathData}
          fill="none"
          stroke="#9333ea" 
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-40"
        />
        <path
          d={pathData}
          fill="none"
          stroke="#9333ea" 
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {validCoords.map((coord, i) => {
           const isStart = i === 0;
           const isEnd = i === validCoords.length - 1;
           const cx = xScale(coord.lng);
           const cy = yScale(coord.lat);
           
           let color = "#cbd5e1"; // default slate
           if (coord.type === 'DISPATCHED') color = "#f59e0b"; // amber
           if (coord.type === 'RECEIVED') color = "#10b981"; // emerald
           if (coord.type === 'RATING') color = "#ec4899"; // pink
           if (isStart) color = "#3b82f6"; // blue
           if (isEnd) color = "#9333ea"; // purple

           return (
             <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isEnd ? 8 : 4}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={2}
                  className="transition-all duration-300 hover:r-6"
                />
                {isEnd && (
                   <circle
                   cx={cx}
                   cy={cy}
                   r={12}
                   fill="none"
                   stroke={color}
                   strokeWidth={1}
                   className="animate-ping"
                 />
                )}
             </g>
           );
        })}
      </>
    );
  }, [coordinates, width, height, loading]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-slate-600 border border-slate-200 shadow-sm flex items-center gap-2">
            <Navigation size={14} className="text-purple-600" />
            Batch Route Visualization
        </div>
      <div ref={containerRef} className="w-full h-[300px] bg-slate-50 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )}
        {!loading && coordinates.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col gap-2">
            <MapPin size={32} />
            <span className="text-sm">No GPS data available yet</span>
          </div>
        )}
        <svg width={width} height={height} className="w-full h-full block">
          {svgContent}
        </svg>
      </div>
    </div>
  );
};

export default RouteMap;
