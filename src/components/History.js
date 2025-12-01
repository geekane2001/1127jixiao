import React, { useState, useEffect } from 'react';

const API_URL = 'https://1127jixiao.2963781804.workers.dev';

const History = ({ selectedOperator, onBack }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedOperator) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/performance-history?person=${selectedOperator.operator_name}`);
                if (!response.ok) {
                    throw new Error('获取历史数据失败');
                }
                const data = await response.json();
                // 按月份降序排序
                data.sort((a, b) => new Date(b.performance_month) - new Date(a.performance_month));
                setHistory(data);
            } catch (error) {
                console.error(error);
                alert(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [selectedOperator]);

    return (
        <div className="main-content">
            <div className="main-header">
                <h1>{selectedOperator.operator_name} 的历史绩效</h1>
                <div className="header-actions">
                    <button className="save-button" onClick={onBack}>返回当前月份</button>
                </div>
            </div>
            {loading ? <p>正在加载历史数据...</p> : history.length > 0 ? (
                history.map(record => (
                    <div key={record.performance_month} className="table-container">
                        <h2>{record.performance_month}</h2>
                        <div className="total-score" style={{ marginBottom: '10px' }}>
                            月度绩效结果: <span>{(record.final_score || 0).toFixed(2)}</span>
                            <small>(总得分: {(record.total_score || 0).toFixed(2)} * EGP系数: {record.egp_score})</small>
                        </div>
                        {record.scores ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>关键考核指标</th>
                                        <th>得分</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(JSON.parse(record.scores)).map(([indicator, score]) => (
                                        <tr key={indicator}>
                                            <td>{indicator}</td>
                                            <td>{score.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p>该月份缺少详细得分记录。</p>}
                    </div>
                ))
            ) : <p>没有找到历史绩效记录。</p>}
        </div>
    );
};

export default History;