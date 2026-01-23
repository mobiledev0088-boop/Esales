import React, {memo, useMemo, useState} from 'react';
import {View, Text, Pressable} from 'react-native';
import Svg, {G, Path} from 'react-native-svg';
import AppText from './customs/AppText';

/* ===================== Types ===================== */

export interface PartnerPieSlice {
  label: string;
  value: number;
  color: string;
  percent: number;
}

interface PartnerPieChartProps {
  data: PartnerPieSlice[];
  size?: number;
  innerRadius?: number;
  sort?: 'none' | 'asc' | 'desc';
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
}

/* ===================== Constants ===================== */

const DEG2RAD = Math.PI / 180;

/* ===================== Helpers ===================== */

const polarToCartesian = (
  cx: number,
  cy: number,
  r: number,
  angle: number,
) => ({
  x: cx + r * Math.cos(angle * DEG2RAD),
  y: cy + r * Math.sin(angle * DEG2RAD),
});

const arcPath = (
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number,
) => {
  const s = polarToCartesian(cx, cy, r, start);
  const e = polarToCartesian(cx, cy, r, end);
  const largeArc = end - start > 180 ? 1 : 0;

  return `
    M ${cx} ${cy}
    L ${s.x} ${s.y}
    A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}
    Z
  `;
};

/* ===================== Component ===================== */

export default function PartnerPieChart({
  data,
  size = 180,
  innerRadius = 0,
  sort = 'none',
  activeIndex: controlledIndex,
  onActiveIndexChange,
}: PartnerPieChartProps) {
  const [uncontrolledIndex, setUncontrolledIndex] = useState<number | null>(
    null,
  );
  const activeIndex =
    controlledIndex !== undefined ? controlledIndex : uncontrolledIndex;

  const setActiveIndex = (index: number | null) => {
    if (controlledIndex === undefined) {
      setUncontrolledIndex(index);
    }
    onActiveIndexChange?.(index);
  };

  const radius = size / 2;
  const center = radius;

  const slices = useMemo(() => {
    const valid = data.filter(d => d.value > 0);

    const sorted = [...valid].sort((a, b) => {
      if (sort === 'asc') return a.value - b.value;
      if (sort === 'desc') return b.value - a.value;
      return 0;
    });

    const total = sorted.reduce((s, d) => s + d.value, 0);
    if (!total) return [];

    // const gapAngle = (GAP_PX / radius) * (180 / Math.PI);
    let startAngle = -90;

    return sorted.map(item => {
      const fullAngle = (item.value / total) * 360;
      const sliceAngle = Math.max(fullAngle, 0);
      const endAngle = startAngle + sliceAngle;

      const path = arcPath(center, center, radius, startAngle, endAngle);
      startAngle += fullAngle;

      return {...item, path};
    });
  }, [data, radius, sort]);

  if (!slices.length) return null;

  return (
    <View className='flex-row justify-between items-center'>
      {/* ===================== Pie ===================== */}
      <Svg width={size} height={size}>
        <G>
          {slices.map((s, i) => {
            const isActive = activeIndex === null || activeIndex === i;
            return (
              <Path
                key={i}
                d={s.path}
                fill={s.color}
                opacity={isActive ? 1 : 0.3}
              />
            );
          })}
        </G>
        {innerRadius > 0 && (
          <Path
            d={arcPath(center, center, innerRadius, 0, 359.9)}
            fill="#FFF"
          />
        )}
      </Svg>

      {/* ===================== Legend ===================== */}
      <View className=''>
        {slices.map((s, i) => {
          const isActive = activeIndex === i;
          const isDimmed = activeIndex !== null && !isActive;
          return (
            <Pressable
              key={i}
              onPress={() => setActiveIndex(isActive ? null : i)}
              className='flex-row items-center mb-2'
              style={{opacity: isDimmed ? 0.4 : 1}}>
              <View
                className='w-3 h-3 rounded-md mr-2'
                style={{backgroundColor: s.color}}
              />
              <AppText style={{fontSize: 13, fontWeight: '600'}}>
                {Math.round(s.percent)}%
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}