import React from 'react';
import { Typography } from 'antd';
import { getSectionL2TextColor } from '../utils/pricelistSectionColors';

const { Text } = Typography;

/**
 * Bölüm başlığı: 1. seviye fiyat listesi rengi, 2. seviye türetilmiş ton.
 */
export default function SectionHeadingLabel({
  l1 = '',
  l2 = '',
  pricelistColor = '#1890ff',
  uncategorizedText,
  className
}) {
  const base = pricelistColor;
  const l2Color = getSectionL2TextColor(base);

  if (!l1 && !l2) {
    if (uncategorizedText) {
      return (
        <Text type="secondary" className={className}>
          {uncategorizedText}
        </Text>
      );
    }
    return null;
  }

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, lineHeight: 1.4 }}
    >
      {l1 ? (
        <Text
          strong
          style={{
            color: base,
            borderLeft: `3px solid ${base}`,
            paddingLeft: 8,
            margin: 0
          }}
        >
          {l1}
        </Text>
      ) : null}
      {!l1 && l2 ? (
        <Text
          strong
          style={{
            color: base,
            borderLeft: `3px solid ${base}`,
            paddingLeft: 8,
            margin: 0
          }}
        >
          {l2}
        </Text>
      ) : null}
      {l1 && l2 ? <span style={{ color: 'rgba(0,0,0,0.22)' }}>→</span> : null}
      {l1 && l2 ? (
        <Text strong style={{ color: l2Color, margin: 0 }}>
          {l2}
        </Text>
      ) : null}
    </span>
  );
}
