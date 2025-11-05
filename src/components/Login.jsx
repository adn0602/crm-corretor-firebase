import React, { useState } from 'react';
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (isLogin) {
                // LOGIN
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                alert('✅ Login realizado com sucesso!');
                onLogin(userCredential.user);
            } else {
                // CADASTRO
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                alert('✅ Cadastro realizado com sucesso!');
                onLogin(userCredential.user);
            }
        } catch (error) {
            alert('❌ Erro: ' + error.message);
        }
    };

    return (
        <div style={{
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            background: '#f5f5f5'
        }}>
            <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                width: '300px'
            }}>
                <h2 style={{ textAlign: 'center', color: '#2c3e50' }}>
                    {isLogin ? '🔐 Login' : '📝 Cadastro'}
                </h2>
                
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            margin: '10px 0',
                            border: '1px solid #ddd',
                            borderRadius: '5px'
                        }}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            margin: '10px 0',
                            border: '1px solid #ddd',
                            borderRadius: '5px'
                        }}
                        required
                    />
                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {isLogin ? 'Entrar' : 'Cadastrar'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '15px' }}>
                    {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#3498db',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        {isLogin ? 'Cadastre-se' : 'Fazer Login'}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Login;
