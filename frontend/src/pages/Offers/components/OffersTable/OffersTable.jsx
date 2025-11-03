// OffersTable - Ana teklifler tablosu ve revizyon expand sistemi
import React from 'react';
import { Table } from 'antd';

const OffersTable = ({
  columns,
  dataSource,
  loading,
  expandedRowKeys,
  onExpandedRowKeysChange,
  expandedRowRender,
  getRevisions,
})  => {

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      onRow={(record) => ({
        onClick: (event) => {
          // Eğer tıklanan element bir buton, input veya link ise satır tıklamasını engelle
          const target = event.target;
          const clickableElements = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'SVG', 'PATH'];
          const isClickableElement = clickableElements.includes(target.tagName) || 
                                   target.closest('button') || 
                                   target.closest('a') || 
                                   target.closest('.ant-btn') ||
                                   target.closest('.ant-popconfirm') ||
                                   target.closest('.ant-dropdown') ||
                                   target.closest('svg') ||
                                   target.closest('[role="img"]') ||
                                   target.closest('.anticon') ||
                                   target.closest('.ant-space') ||
                                   target.classList.contains('anticon');
          
          if (isClickableElement) {
            event.stopPropagation();
            return;
          }
          
          // Sadece ana teklif satırlarında expand çalışsın
          if (record.parent_offer_id) {
            return;
          }
          
          // Ana teklif satırında ve revizyon varsa expand/collapse yap
          const revisions = getRevisions(record.id);
          if (revisions.length > 0) {
            const isExpanded = expandedRowKeys.includes(record.id);
            onExpandedRowKeysChange(prev => 
              isExpanded 
                ? prev.filter(key => key !== record.id)
                : [...prev, record.id]
            );
          }
        },
        style: {
          cursor: getRevisions(record.id).length > 0 ? 'pointer' : 'default'
        }
      })}
      pagination={{
        total: dataSource.length,
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => 
          `${range[0]}-${range[1]} / ${total} sayfa`,
        pageSizeOptions: ['10', '20', '50'],
      }}
      scroll={{ x: 1000 }}
      size="small"
      rowKey="id"
      bordered
      expandable={{
        expandedRowRender,
        expandedRowKeys: expandedRowKeys,
        onExpand: (expanded, record) => {
          onExpandedRowKeysChange(expanded 
            ? [...expandedRowKeys, record.id] 
            : expandedRowKeys.filter(key => key !== record.id)
          );
        },
        rowExpandable: (record) => {
          const revisions = getRevisions(record.id);
          return revisions.length > 0;
        },
        expandRowByClick: false,
      }}
    />
  );
};

export default OffersTable;
