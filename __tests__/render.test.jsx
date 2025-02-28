import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import LandingPage from '../app/page'
import LoginPage from '../app/auth/login/page'
import SignupPage from '../app/auth/signup/page'
import ResetPage from '../app/auth/reset/page'
import ResetPasswordPage from '../app/auth/reset-password/page'
import VerifyPage from '../app/auth/verify-tp/page'
import DashboardPage from '../app/dashboard/page'
import { useSearchParams } from 'next/navigation';

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      prefetch: () => null
    };
  },
  useSearchParams: jest.fn(),

}));

const mockGet = jest.fn();
mockGet.mockReturnValue('5000');

(useSearchParams).mockReturnValue({
  get: mockGet,
});

  jest.mock("next-auth/react", () => {
    const originalModule = jest.requireActual('next-auth/react');
    const mockSession = {
      //expires: new Date(Date.now() + 2 * 86400).toISOString(),
      user: { name: "admin" }
    };
    return {
      __esModule: true,
      ...originalModule,
      useSession: jest.fn(() => {
        return {data: mockSession, status: 'authenticated'}  // return type is [] in v3 but changed to {} in v4
      }),
      
    };
  });


describe('Page', () => {
  it('Render: Landing Page', () => {
    render(<LandingPage />)
 
    waitFor(async () =>

      expect(await screen.findByRole("body")).toBeInTheDocument(),

    )
  })
})

describe('Page', () => {
  it('Render: Login Page', () => {
    render(<LoginPage/>)
 
    waitFor(async () =>

      expect(await screen.findByRole("body")).toBeInTheDocument(),

    )
  })
})

describe('Page', () => {
  it('Render: Signup Page', () => {
    render(<SignupPage/>)
 
    waitFor(async () =>

      expect(await screen.findByRole("body")).toBeInTheDocument(),

    )
  })
})

describe('Page', () => {
  it('Render: Reset Page', () => {
    render(<ResetPage/>)
 
    waitFor(async () =>

      expect(await screen.findByRole("body")).toBeInTheDocument(),

    )
  })
})

describe('Page', () => {
  it('Render: Verify Page', () => {
    render(<VerifyPage/>)
 
    waitFor(async () =>

      expect(await screen.findByRole("body")).toBeInTheDocument(),

    )
  })
})


describe('Page', () => {
  it('Render: Dashboard Page', () => {
    render(<DashboardPage/>)
 
    waitFor(async () =>

      expect(await screen.findByRole("body")).toBeInTheDocument(),

    )
  })   
})

describe('Page', () => {
  it('Render: Reset Password Page', () => {
    render(<ResetPasswordPage/>)
 
    waitFor(async () =>

      expect(await screen.findByRole("body")).toBeInTheDocument(),

    )
  })   
})


