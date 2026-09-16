import React, { useEffect } from 'react';
import RealtimeFeedPanel from './RealtimeFeedPanel';
import { realtimeFeed } from '../services/realtimeFeed';

/** Painel + publicação de laudo no feed online. */
export function OficIARealtimePanels(props: { plate: string; chassis: string }) {
  return <RealtimeFeedPanel plate={props.plate} chassis={props.chassis} />;
}

export function publishDiagnosisToFeed(input: {
  plate: string;
  chassis: string;
  problemName?: string;
  diagnosticNotes?: string;
  odometerKm?: number;
}) {
  void realtimeFeed.publish({
    type: 'diagnosis',
    plate: input.plate,
    chassis: input.chassis,
    title: String(input.problemName || 'Laudo OficIA'),
    body: String(input.diagnosticNotes || '').slice(0, 400),
    odometerKm: input.odometerKm,
  });
}

export function useRealtimeFeedLifecycle(plate: string, chassis: string) {
  useEffect(() => {
    realtimeFeed.setVehicleFilter(plate, chassis);
    realtimeFeed.start(4000);
  }, [plate, chassis]);
}
