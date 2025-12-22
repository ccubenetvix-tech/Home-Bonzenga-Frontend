import emailjs from '@emailjs/browser';

/**
 * Service Configuration for HomeBonzenga EmailJS
 */
export const EMAILJS_CONFIG = {
    PUBLIC_KEY: 'tqZAmmUGLAnHjASq7',
    SERVICE_ID: 'service_vk2ymeg',
    TEMPLATE_ID: 'template_z51c5x8',
    FROM_NAME: 'HomeBonzenga',
    FROM_EMAIL: 'bookingshomebonzenga@gmail.com'
};

interface EmailParams {
    to_email: string;
    user_name: string;
    verification_link: string;
    role: 'CUSTOMER' | 'VENDOR';
}

/**
 * Sends a verification email using EmailJS
 */
export const sendVerificationEmail = async (params: EmailParams) => {
    try {
        const templateParams = {
            to_email: params.to_email,
            user_name: params.user_name,
            verification_link: params.verification_link,
            role: params.role,
            from_name: EMAILJS_CONFIG.FROM_NAME,
            from_email: EMAILJS_CONFIG.FROM_EMAIL
        };

        const response = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            templateParams,
            EMAILJS_CONFIG.PUBLIC_KEY
        );

        console.log('✅ EmailJS success:', response.status, response.text);
        return { success: true, response };
    } catch (error) {
        console.error('❌ EmailJS error:', error);
        return { success: false, error };
    }
};
