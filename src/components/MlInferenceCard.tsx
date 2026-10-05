import React from 'react';
import { Cpu, Binary, Network, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ModelOutputs } from '../types/terrabreath';
import { ProvenanceBadge } from './ProvenanceBadge';

interface MlInferenceCardProps {
  models: ModelOutputs | null;
}

export const MlInferenceCard: React.FC<MlInferenceCardProps> = ({ models }) => {
  if (!models) {
    return (
      <div className="bg-[#101622] border border-slate-800 rounded-lg p-5 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-slate-800 rounded"></div>
      </div>
    );
  }

  const { model0_baseline, model1_segmentation, model2_riskClassifier } = models;

  return (
    <div className="bg-[#101622] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Multi-Tier AI / ML Model Inference Engine
          </h3>
          <ProvenanceBadge type="MODEL" source="Local Scikit/PyTorch" />
        </div>
        <span className="text-xs font-mono text-slate-400">
          3-Tier Validation
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Model 0: Baseline */}
          <div className="bg-[#0b0e14] border border-slate-800 p-4 rounded flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Tier 0: Baseline</span>
                <Binary className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <h4 className="text-xs font-semibold text-slate-200">
                Deterministic Otsu Threshold
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Threshold on SAR VV backscatter (-16.5 dB cutoff) to isolate specular water surfaces.
              </p>

              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Water Extent:</span>
                  <span className="text-slate-100 font-semibold">{model0_baseline.waterMaskAreaKm2} km²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Anomaly Flag:</span>
                  <span className={model0_baseline.detectedAnomaly ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                    {model0_baseline.detectedAnomaly ? 'DETECTED' : 'NORMAL'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Confidence:</span>
                  <span className="text-cyan-400">{(model0_baseline.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 text-[10px] text-slate-500 font-mono flex items-center justify-between">
              <span>Non-ML Physics Baseline</span>
              <ProvenanceBadge type="MODEL" />
            </div>
          </div>

          {/* Model 1: U-Net Segmentation */}
          <div className="bg-[#0b0e14] border border-slate-800 p-4 rounded flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Tier 1: Segmentation</span>
                <Network className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <h4 className="text-xs font-semibold text-slate-200">
                Deep U-Net SAR Segmenter
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Trained on dual-pol Sentinel-1 patches with DEM elevation priors for pixel-level flood masks.
              </p>

              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Segmented Water:</span>
                  <span className="text-cyan-300 font-semibold">{model1_segmentation.segmentedWaterKm2} km²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dice / F1 Score:</span>
                  <span className="text-emerald-400 font-semibold">{(model1_segmentation.diceScore * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Model Confidence:</span>
                  <span className="text-purple-300 font-semibold">{(model1_segmentation.expansionConfidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 text-[10px] text-slate-500 font-mono flex items-center justify-between">
              <span>ResNet-34 Backbone</span>
              <ProvenanceBadge type="MODEL" />
            </div>
          </div>

          {/* Model 2: Multi-Source Classifier */}
          <div className="bg-[#0b0e14] border border-slate-800 p-4 rounded flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Tier 2: Risk Ensemble</span>
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <h4 className="text-xs font-semibold text-slate-200">
                XGBoost Multi-Source Model
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Gradient-boosted decision trees merging SAR, 24h GPM rain, slope, and historical vulnerability.
              </p>

              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk Probability:</span>
                  <span className="text-amber-400 font-bold">{(model2_riskClassifier.riskProbability * 100).toFixed(1)}%</span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1">
                  Dominant Feature: <span className="text-slate-200">{model2_riskClassifier.keyFeatureWeight}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 text-[10px] text-slate-500 font-mono flex items-center justify-between">
              <span>Local Scikit-Learn</span>
              <ProvenanceBadge type="MODEL" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
