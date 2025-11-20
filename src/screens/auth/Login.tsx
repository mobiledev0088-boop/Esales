import Card from '../../components/Card';
import AppInput from '../../components/customs/AppInput';
import AppButton from '../../components/customs/AppButton';
import AuthLayout from '../../components/layout/AuthLayout';

import { useState, useCallback } from 'react';
import { getDeviceId } from 'react-native-device-info';
import { useLoginMutation } from '../../hooks/queries/auth';

const Login = () => {
    // const [formData, setFormData] = useState({ username: 'Ashish_Devasi', password: '@ITSMbpm07072025' });
    const [formData, setFormData] = useState({ username: 'Mayur_S', password: 'Mr8@089949190088' });
    const [errorMessage, setErrorMessage] = useState<{ [key: string]: string }>({});

    const { mutate: login } = useLoginMutation();

    const handleChange = useCallback((field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrorMessage(prev => ({ ...prev, [field]: '' }));
    }, []);

    const isValid = () => {
        const errors: { [key: string]: string } = {};
        const { username, password } = formData;

        if (!username) errors.username = 'Username is required';
        else if (username.length < 3) errors.username = 'Username must be at least 3 characters';

        if (!password) errors.password = 'Password is required';
        else if (password.length < 3) errors.password = 'Password must be at least 3 characters';

        setErrorMessage(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (isValid()) {
            let dataToSend = {
                username: formData.username,
                password: formData.password,
                deviceId: getDeviceId(),
            };
            login(dataToSend);
        }
    };

    return (
        <AuthLayout>
            <Card className='p-6 px-10'>
                <AppInput
                    value={formData.username}
                    setValue={value => handleChange('username', value)}
                    variant='underline'
                    label='Username'
                    placeholder='Enter your username'
                    leftIcon='person'
                    containerClassName='mb-6'
                    error={errorMessage.username}
                    isOptional
                />
                <AppInput
                    value={formData.password}
                    setValue={value => handleChange('password', value)}
                    variant='underline'
                    label='Password'
                    placeholder='Enter your password'
                    leftIcon='lock-closed'
                    secureTextEntry
                    isPassword
                    error={errorMessage.password}
                    isOptional
                />
                <AppButton
                    title='Login'
                    onPress={handleSubmit}
                    className='mt-8 w-4/6 self-center'
                />
            </Card>
        </AuthLayout>
    );
};

export default Login;
