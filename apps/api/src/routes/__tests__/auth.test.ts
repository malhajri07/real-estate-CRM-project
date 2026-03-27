import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../services/auth.service';

// Unit tests for AuthService — no DB required
describe('AuthService', () => {
    describe('generateToken / verifyToken', () => {
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            username: 'testuser',
            roles: 'AGENT',
            organizationId: 'org-456',
        };

        it('generates a valid JWT token', () => {
            const token = AuthService.generateToken(mockUser);
            expect(token).toBeTruthy();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        it('verifies a valid token and returns payload', () => {
            const token = AuthService.generateToken(mockUser);
            const payload = AuthService.verifyToken(token);

            expect(payload).not.toBeNull();
            expect(payload?.userId).toBe(mockUser.id);
            expect(payload?.email).toBe(mockUser.email);
            expect(payload?.roles).toBe(mockUser.roles);
            expect(payload?.organizationId).toBe(mockUser.organizationId);
        });

        it('returns null for an invalid token', () => {
            const payload = AuthService.verifyToken('invalid.token.here');
            expect(payload).toBeNull();
        });

        it('returns null for an empty token', () => {
            const payload = AuthService.verifyToken('');
            expect(payload).toBeNull();
        });

        it('returns null for a tampered token', () => {
            const token = AuthService.generateToken(mockUser);
            const tampered = token.slice(0, -5) + 'XXXXX';
            const payload = AuthService.verifyToken(tampered);
            expect(payload).toBeNull();
        });

        it('handles null email in token', () => {
            const token = AuthService.generateToken({ ...mockUser, email: null });
            const payload = AuthService.verifyToken(token);
            expect(payload?.email).toBeNull();
        });
    });

    describe('hashPassword / verifyPassword', () => {
        it('hashes a password and verifies it correctly', async () => {
            const password = 'SecurePass123!';
            const hash = await AuthService.hashPassword(password);

            expect(hash).toBeTruthy();
            expect(hash).not.toBe(password);
            expect(hash.startsWith('$2')).toBe(true); // bcrypt hash prefix

            const isValid = await AuthService.comparePassword(password, hash);
            expect(isValid).toBe(true);
        });

        it('rejects wrong password', async () => {
            const hash = await AuthService.hashPassword('CorrectPassword');
            const isValid = await AuthService.comparePassword('WrongPassword', hash);
            expect(isValid).toBe(false);
        });
    });
});
