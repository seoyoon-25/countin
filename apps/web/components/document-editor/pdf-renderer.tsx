'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import { Block } from './types';

// Register Korean font (using Noto Sans KR from Google Fonts CDN)
Font.register({
  family: 'NotoSansKR',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/nicor88/font-noto-sans-kr@v1.4.1/dist/NotoSansKR-Regular.otf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/nicor88/font-noto-sans-kr@v1.4.1/dist/NotoSansKR-Bold.otf',
      fontWeight: 'bold',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'NotoSansKR',
    fontSize: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  h1: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  h2: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  h3: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 10,
  },
  listItem: {
    fontSize: 10,
    marginBottom: 4,
    paddingLeft: 20,
  },
  table: {
    width: '100%',
    marginVertical: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderBottomStyle: 'solid',
  },
  tableHeader: {
    backgroundColor: '#F1F5F9',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    borderRightStyle: 'solid',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    marginVertical: 15,
  },
  image: {
    maxWidth: '100%',
    marginVertical: 10,
  },
  signature: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'solid',
  },
  signatureLabel: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 4,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
    marginTop: 30,
    marginBottom: 4,
  },
  budgetTable: {
    marginVertical: 10,
  },
  budgetSection: {
    marginBottom: 10,
  },
  budgetSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: '#F1F5F9',
    padding: 6,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94A3B8',
  },
  pageNumber: {
    textAlign: 'center',
  },
});

interface DocumentPDFProps {
  title: string;
  blocks: Block[];
}

export function DocumentPDF({ title, blocks }: DocumentPDFProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  const renderBlock = (block: Block, index: number) => {
    switch (block.type) {
      case 'heading':
        const headingStyle = block.level === 'h1' ? styles.h1 : block.level === 'h2' ? styles.h2 : styles.h3;
        return (
          <Text key={block.id} style={headingStyle}>
            {block.content}
          </Text>
        );

      case 'paragraph':
        return (
          <Text key={block.id} style={styles.paragraph}>
            {block.content}
          </Text>
        );

      case 'list':
        return (
          <View key={block.id}>
            {block.items?.map((item, idx) => (
              <Text key={idx} style={styles.listItem}>
                {block.style === 'numbered' ? `${idx + 1}. ` : '• '}{item}
              </Text>
            ))}
          </View>
        );

      case 'table':
        return (
          <View key={block.id} style={styles.table}>
            {/* Header */}
            {block.headers && block.headers.length > 0 && (
              <View style={[styles.tableRow, styles.tableHeader]}>
                {block.headers.map((header, idx) => (
                  <Text
                    key={idx}
                    style={[styles.tableCell, { flex: 1 }]}
                  >
                    {header}
                  </Text>
                ))}
              </View>
            )}
            {/* Rows */}
            {block.rows?.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.tableRow}>
                {row.map((cell, cellIdx) => (
                  <Text key={cellIdx} style={[styles.tableCell, { flex: 1 }]}>
                    {cell}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        );

      case 'divider':
        return <View key={block.id} style={styles.divider} />;

      case 'image':
        if (block.url) {
          return (
            <View key={block.id}>
              <Image src={block.url} style={styles.image} />
              {block.alt && (
                <Text style={{ fontSize: 8, color: '#64748B', textAlign: 'center' }}>
                  {block.alt}
                </Text>
              )}
            </View>
          );
        }
        return null;

      case 'signature':
        return (
          <View key={block.id} style={styles.signature}>
            <Text style={styles.signatureLabel}>{block.label || '서명'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, color: '#64748B' }}>성명</Text>
                <Text style={{ fontSize: 10 }}>{block.name || ''}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, color: '#64748B' }}>날짜</Text>
                <Text style={{ fontSize: 10 }}>{block.date || ''}</Text>
              </View>
            </View>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8, color: '#94A3B8', textAlign: 'center' }}>(서명)</Text>
          </View>
        );

      case 'budget-table':
        const totalIncome = block.incomeItems?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
        const totalExpense = block.expenseItems?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

        return (
          <View key={block.id} style={styles.budgetTable}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>{block.title}</Text>

            {/* Income Section */}
            <View style={styles.budgetSection}>
              <Text style={[styles.budgetSectionTitle, { backgroundColor: '#D1FAE5', color: '#047857' }]}>수입</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>항목</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>산출근거</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>금액</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>비고</Text>
                </View>
                {block.incomeItems?.map((item, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{item.calculation}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(item.amount || 0)}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{item.note}</Text>
                  </View>
                ))}
                <View style={[styles.tableRow, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={[styles.tableCell, { flex: 4, textAlign: 'right', fontWeight: 'bold' }]}>소계</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>{formatCurrency(totalIncome)}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]} />
                </View>
              </View>
            </View>

            {/* Expense Section */}
            <View style={styles.budgetSection}>
              <Text style={[styles.budgetSectionTitle, { backgroundColor: '#FFE4E6', color: '#BE123C' }]}>지출</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>항목</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>산출근거</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>금액</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>비고</Text>
                </View>
                {block.expenseItems?.map((item, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{item.calculation}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(item.amount || 0)}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{item.note}</Text>
                  </View>
                ))}
                <View style={[styles.tableRow, { backgroundColor: '#FFE4E6' }]}>
                  <Text style={[styles.tableCell, { flex: 4, textAlign: 'right', fontWeight: 'bold' }]}>소계</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>{formatCurrency(totalExpense)}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]} />
                </View>
              </View>
            </View>

            {/* Balance */}
            <View style={[styles.table, { backgroundColor: '#F1F5F9' }]}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 4, textAlign: 'right', fontWeight: 'bold', fontSize: 11 }]}>잔액 (수입 - 지출)</Text>
                <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', fontWeight: 'bold', fontSize: 11, color: totalIncome - totalExpense >= 0 ? '#2563EB' : '#DC2626' }]}>
                  {formatCurrency(totalIncome - totalExpense)}
                </Text>
              </View>
            </View>
          </View>
        );

      case 'settlement-table':
        const settlementItems = block.items || [];
        const totalBudget = settlementItems.reduce((sum, item) => sum + (item.budgetAmount || 0), 0);
        const totalExecuted = settlementItems.reduce((sum, item) => sum + (item.executedAmount || 0), 0);

        return (
          <View key={block.id} style={styles.budgetTable}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>{block.title}</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>항목</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>예산액</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>집행액</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>잔액</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>집행률</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>비고</Text>
              </View>
              {settlementItems.map((item, idx) => {
                const balance = (item.budgetAmount || 0) - (item.executedAmount || 0);
                const rate = item.budgetAmount > 0 ? Math.round((item.executedAmount / item.budgetAmount) * 100) : 0;
                return (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(item.budgetAmount || 0)}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(item.executedAmount || 0)}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', color: balance >= 0 ? '#2563EB' : '#DC2626' }]}>{formatCurrency(balance)}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', color: rate > 100 ? '#DC2626' : '#374151' }]}>{rate}%</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{item.note}</Text>
                  </View>
                );
              })}
              <View style={[styles.tableRow, { backgroundColor: '#F1F5F9' }]}>
                <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>합계</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>{formatCurrency(totalBudget)}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>{formatCurrency(totalExecuted)}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: 'bold', color: totalBudget - totalExecuted >= 0 ? '#2563EB' : '#DC2626' }]}>
                  {formatCurrency(totalBudget - totalExecuted)}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>
                  {totalBudget > 0 ? Math.round((totalExecuted / totalBudget) * 100) : 0}%
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]} />
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        {blocks.map((block, index) => renderBlock(block, index))}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

// Export for dynamic import (SSR disabled)
export default DocumentPDF;
