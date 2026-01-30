import { isPublicPage } from './authConfig';

describe('authConfig', () => {
    describe('isPublicPage', () => {
        it('should return true for public pages', () => {
            expect(isPublicPage('/')).toBe(true);
            expect(isPublicPage('/login')).toBe(true);
            expect(isPublicPage('/users/register')).toBe(true);
            expect(isPublicPage('/setup')).toBe(true);
        });

        it('should return false for protected pages', () => {
            expect(isPublicPage('/dashboard')).toBe(false);
            expect(isPublicPage('/profile')).toBe(false);
            expect(isPublicPage('/api/secret')).toBe(false);
        });

        it('should match exactly', () => {
            expect(isPublicPage('/login/extra')).toBe(false);
        });
    });
});
