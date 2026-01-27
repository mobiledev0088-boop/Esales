import Card from '../../components/Card';
import AppInput from '../../components/customs/AppInput';
import AppButton from '../../components/customs/AppButton';
import AuthLayout from '../../components/layout/AuthLayout';

import { useState, useCallback, useRef } from 'react';
import { TextInput } from 'react-native';
import { getDeviceId } from 'react-native-device-info';
import { useLoginMutation } from '../../hooks/queries/auth';

const Login = () => {
    const [formData, setFormData] = useState({ username: 'Ashish_Devasi', password: '@ITSMbpm07072025' });
    // const [formData, setFormData] = useState({ username: 'IN2407A0027', password: '4lnsm4sq.ovn' });
    // const [formData, setFormData] = useState({ username: 'Vishwanath_Niranjan', password: 'Asus@#20241234567' });
    // const [formData, setFormData] = useState({ username: 'Gina_Lai', password: 'cHW0m#7+#HsY^po' });
    // const [formData, setFormData] = useState({ username: 'Varun_Sharma', password: 'Varunasus@123456' });
    // const [formData, setFormData] = useState({ username: '', password: '' });
    const [errorMessage, setErrorMessage] = useState<{ [key: string]: string }>({});
    
    const passwordInputRef = useRef<TextInput>(null);

    const { mutate: login,isPending } = useLoginMutation();

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
        <AuthLayout >
            <Card className='p-6 rounded-3xl bg-white'>
                <AppInput
                    value={formData.username}
                    setValue={value => handleChange('username', value)}
                    size='lg'
                    readOnly={isPending}
                    variant='underline'
                    label='Username'
                    placeholder='Enter your username'
                    leftIcon='person'
                    containerClassName='mb-6'
                    error={errorMessage.username}
                    isOptional
                    returnKeyType='next'
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    submitBehavior='submit'
                    
                />
                <AppInput
                    ref={passwordInputRef}
                    value={formData.password}
                    setValue={value => handleChange('password', value)}
                    size='lg'
                    variant='underline'
                    readOnly={isPending}
                    label='Password'
                    placeholder='Enter your password'
                    leftIcon='lock-closed'
                    secureTextEntry
                    isPassword
                    error={errorMessage.password}
                    isOptional
                    returnKeyType='done'
                    onSubmitEditing={handleSubmit}
                />
                <AppButton
                    title='Login'
                    onPress={handleSubmit}
                    className='mt-8 w-4/6 self-center rounded-md'
                />
            </Card>
        </AuthLayout>
    );
};

export default Login;
