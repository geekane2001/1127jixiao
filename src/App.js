import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import Login from './components/Login';

const API_URL = 'https://jxbk.jingchaowan.dpdns.org/';

function App() {
  const [user, setUser] = useState(null);
  const [operators, setOperators] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [loading, setLoading] = useState(false); // 改为 false，因为需要先登录
  const [error, setError] = useState(null);

  // 初始化时检查是否已登录
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // 登录成功后的数据获取逻辑
  useEffect(() => {
    if (!user) return; // 未登录时不获取数据

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      // 1. 尝试从LocalStorage获取缓存
      const cachedData = localStorage.getItem('performanceData');
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          setOperators(parsedData.data);
          // 如果是员工，只显示自己
          if (user.role === 'yuangong') {
             const myData = parsedData.data.find(op => op.operator_name === user.username);
             if (myData) {
                 setOperators([myData]);
                 setSelectedOperator(myData);
             } else {
                 setOperators([]);
                 setError('未找到您的绩效数据，请联系管理员。');
             }
          } else {
              // 管理员逻辑
              setOperators(parsedData.data);
              if (parsedData.data.length > 0) {
                setSelectedOperator(parsedData.data[0]);
              }
          }
          
          console.log("从缓存加载数据成功。");
          setLoading(false);
          return; // 使用缓存数据后，本次不再请求网络
        } catch (e) {
          console.error("解析缓存数据失败:", e);
          localStorage.removeItem('performanceData'); // 如果缓存无效则移除
        }
      }

      // 2. 如果没有缓存，则从网络获取
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`网络请求失败: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
        // 3. 将新数据存入LocalStorage
        localStorage.setItem('performanceData', JSON.stringify(data));

         // 如果是员工，只显示自己
         if (user.role === 'yuangong') {
            const myData = data.data.find(op => op.operator_name === user.username);
            if (myData) {
                setOperators([myData]);
                setSelectedOperator(myData);
            } else {
                setOperators([]);
                setError('未找到您的绩效数据，请联系管理员。');
            }
         } else {
            setOperators(data.data);
            if (data.data.length > 0) {
              setSelectedOperator(data.data[0]);
            }
         }
        
        console.log("从API获取数据并缓存成功。");

      } catch (err) {
        setError(err.message);
        console.error("获取数据失败:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleOperatorChange = (operatorName) => {
    const operator = operators.find(op => op.operator_name === operatorName);
    setSelectedOperator(operator);
  };
  
  const handleLogin = (loginData) => {
      setUser(loginData.user);
      localStorage.setItem('user', JSON.stringify(loginData.user));
      // Token stored separately if needed, but for now we just use user object state
      localStorage.setItem('token', loginData.token);
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('performanceData'); // Logout时清除数据缓存
      setOperators([]);
      setSelectedOperator(null);
  };

  // 渲染逻辑
  if (!user) {
      return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return <div className="app-container"><h1>加载中...</h1></div>;
  }

  if (error) {
    return (
        <div className="app-container">
            <h1>错误: {error}</h1>
            <button onClick={handleLogout} style={{marginTop: '20px', padding: '10px 20px', cursor: 'pointer'}}>退出登录</button>
        </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar
        operators={operators}
        selectedOperator={selectedOperator}
        onOperatorChange={handleOperatorChange}
        user={user}
        onLogout={handleLogout}
      />
      <MainContent
        selectedOperator={selectedOperator}
        user={user}
      />
    </div>
  );
}

export default App;
