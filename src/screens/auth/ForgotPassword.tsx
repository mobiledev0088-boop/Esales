import AuthLayout from '../../components/layout/AuthLayout'
import Card from '../../components/Card'
import AppInput from '../../components/customs/AppInput'
import AppButton from '../../components/customs/AppButton'

import { useState } from 'react'
import { useForgotPasswordMutation } from '../../hooks/queries/auth'

const ForgotPassword = () => {
    const [username, setUsername] = useState('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const { mutate: changePassword } = useForgotPasswordMutation();
    const isValid = () => {
        if (!username) {
            setErrorMessage('Username is required');
            return false;
        } else if (username.length < 3) {
            setErrorMessage('Username must be at least 3 characters');
            return false;
        }
        setErrorMessage('');
        return true;
    }
    const handleSubmit = () => {
        if (isValid()) {
            changePassword({ username });
        }
    }
    return (
        <AuthLayout>
            <Card className='p-6 px-10'>
                <AppInput
                    value={username}
                    setValue={(value) => { setUsername(value); errorMessage && setErrorMessage(''); }}
                    variant='underline'
                    label='Username'
                    placeholder='Enter your username'
                    leftIcon='person'
                    containerClassName='mb-6'
                    error={errorMessage}
                    isOptional
                />
                <AppButton
                    title='Login'
                    onPress={handleSubmit}
                    className='mt-8 w-4/6 self-center'
                />
            </Card>
        </AuthLayout>
    )
}

export default ForgotPassword