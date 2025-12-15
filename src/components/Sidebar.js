import React, { useState, useRef } from 'react';

const API_URL = 'https://jxbk.jingchaowan.dpdns.org';

const Sidebar = ({ operators, selectedOperator, onOperatorChange }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('全部');
  const fileInputRef = useRef(null);

  const departments = ['全部', ...new Set(operators.map(op => op.department || '运营部'))];
  
  const filteredOperators = selectedDepartment === '全部'
    ? operators
    : operators.filter(op => (op.department || '运营部') === selectedDepartment);

  // 当部门切换时，如果当前选中人员不在新列表中，重置选择
  React.useEffect(() => {
    if (filteredOperators.length > 0) {
      // 检查当前选中的人员是否在过滤后的列表中
      const isSelectedInList = selectedOperator && filteredOperators.some(op => op.operator_name === selectedOperator.operator_name);
      
      // 如果不在列表中（比如切换了部门），或者当前没有选中任何人，则默认选中第一个
      if (!isSelectedInList) {
        onOperatorChange(filteredOperators[0].operator_name);
      }
    }
  }, [selectedDepartment, filteredOperators, selectedOperator, onOperatorChange]);

  const handleSync = async () => {
    setIsSyncing(true);
    alert('正在后台同步最新数据，请稍候...');
    try {
      const response = await fetch(`${API_URL}/update`, { method: 'POST' });
      if (!response.ok) {
        throw new Error(`同步请求失败: ${response.status}`);
      }
      const result = await response.json();
      alert(`同步成功！\n${result.message}`);
      
      localStorage.removeItem('performanceData');
      window.location.reload();

    } catch (error) {
      alert(`同步失败: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('请先选择一个文件！');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_URL}/update-groups`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`上传失败: ${response.status}`);
      }
      const result = await response.json();
      alert(`分组更新成功！\n${result.message}`);
    } catch (error) {
      alert(`上传失败: ${error.message}`);
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="sidebar">
      <h2>数据管理</h2>
      <div className="sidebar-section">
        <label htmlFor="department-select">选择部门:</label>
        <select
          id="department-select"
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          style={{marginBottom: '10px'}}
        >
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <label htmlFor="operator-select">选择运营成员:</label>
        <select
          id="operator-select"
          value={selectedOperator ? selectedOperator.operator_name : ''}
          onChange={(e) => onOperatorChange(e.target.value)}
        >
          <option value="" disabled>请选择人员</option>
          {filteredOperators.map((op) => (
            <option key={op.operator_name} value={op.operator_name}>
              {op.operator_name}
            </option>
          ))}
        </select>
      </div>

      {selectedOperator && (
        <div className="sidebar-section">
          <p><strong>选中人员:</strong> {selectedOperator.operator_name}</p>
          <p><strong>负责分组:</strong> {selectedOperator.group_name}</p>
          <p><strong>门店数量:</strong> {selectedOperator.store_count}家</p>
          <p><strong>平均经营分:</strong> {(selectedOperator.avg_score || 0).toFixed(2)}分</p>
          <p><strong>总核销金额:</strong> {(selectedOperator.total_salary || 0).toFixed(2)}元</p>
        </div>
      )}

      <div className="sidebar-section">
        <h3>数据采集</h3>
        <button className="sync-button" onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? '同步中...' : '立刻同步'}
        </button>
      </div>

      <div className="sidebar-section">
        <h3>分组管理</h3>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".xlsx, .xls"
        />
        <button className="upload-button" onClick={handleUploadClick} disabled={isUploading}>
          选择文件
        </button>
        {selectedFile && <span className="file-name">{selectedFile.name}</span>}
        <button className="sync-button" onClick={handleUpload} disabled={isUploading || !selectedFile} style={{marginTop: '10px'}}>
          {isUploading ? '上传中...' : '上传分组'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
