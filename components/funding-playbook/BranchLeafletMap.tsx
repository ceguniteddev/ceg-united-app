"use client";

import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Branch } from "@/types/funding-playbook";
import { estimateDriveMinutes, getDirectionsUrl } from "./branch-utils";

function MapController({
  branches,
  activeRank,
  markerRefs,
}: {
  branches: Branch[];
  activeRank: number | null;
  markerRefs: React.MutableRefObject<{ [rank: number]: L.Marker | null }>;
}) {
  const map = useMap();

  // Fit bounds when branches change
  useEffect(() => {
    const validBranches = branches.filter(
      (b) =>
        typeof b.lat === "number" &&
        typeof b.lng === "number" &&
        (b.lat !== 0 || b.lng !== 0),
    );
    if (validBranches.length === 0) return;

    const bounds = L.latLngBounds(
      validBranches.map((b) => [b.lat, b.lng] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [branches, map]);

  // Open active marker popup
  useEffect(() => {
    if (!activeRank) return;
    const marker = markerRefs.current[activeRank];
    if (marker) {
      marker.openPopup();
      map.panTo(marker.getLatLng(), { animate: true });
    }
  }, [activeRank, map, markerRefs]);

  return null;
}

function createCustomIcon(rank: number, isActive: boolean) {
  const size = isActive ? 34 : 28;
  const bgColor = isActive ? "#1e293b" : "#2563eb"; // Dark navy when active, bright blue default
  const borderColor = "#ffffff";

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size + 8}px;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
    ">
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${bgColor};
        border: 2px solid ${borderColor};
        color: #ffffff;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-weight: 700;
        font-size: ${isActive ? "14px" : "12px"};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
      ">
        ${rank}
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid ${bgColor};
        margin-top: -2px;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-branch-marker",
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 10)],
  });
}

export default function BranchLeafletMap({
  branches,
  activeRank,
  onSelect,
}: {
  branches: Branch[];
  activeRank: number | null;
  onSelect: (rank: number) => void;
}) {
  const markerRefs = useRef<{ [rank: number]: L.Marker | null }>({});

  const validBranches = branches.filter(
    (b) =>
      typeof b.lat === "number" &&
      typeof b.lng === "number" &&
      (b.lat !== 0 || b.lng !== 0),
  );

  const defaultCenter: [number, number] =
    validBranches.length > 0
      ? [validBranches[0].lat, validBranches[0].lng]
      : [29.6516, -82.3248]; // Gainesville FL default if empty

  return (
    <div className="relative w-full h-[360px] sm:h-[400px] rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapController
          branches={branches}
          activeRank={activeRank}
          markerRefs={markerRefs}
        />

        {branches.map((b, idx) => {
          const rank = idx + 1;
          if (!b.lat || !b.lng) return null;
          const isActive = activeRank === rank;
          const driveMins = estimateDriveMinutes(b.distanceMiles);
          const directionsUrl = getDirectionsUrl(b);

          return (
            <Marker
              key={b.placeId || idx}
              position={[b.lat, b.lng]}
              icon={createCustomIcon(rank, isActive)}
              ref={(ref) => {
                markerRefs.current[rank] = ref;
              }}
              eventHandlers={{
                click: () => onSelect(rank),
              }}
            >
              <Popup className="branch-map-popup">
                <div className="p-1 space-y-1 max-w-[220px]">
                  <h4 className="text-[13px] font-bold text-gray-900 leading-tight">
                    {b.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    {b.address}
                  </p>

                  {b.phone && (
                    <a
                      href={`tel:${b.phone}`}
                      className="block text-[11px] font-mono font-medium text-blue-600 hover:underline mt-1"
                    >
                      {b.phone}
                    </a>
                  )}

                  <div className="text-[11px] font-semibold text-gray-600 mt-1">
                    {b.distanceMiles} mi · {driveMins} min
                  </div>

                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-blue-600 hover:underline mt-1.5"
                  >
                    Get directions &rarr;
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
