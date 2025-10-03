import React from 'react';
import { User } from '../App';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar = ({ user, onLogout }: NavbarProps) => {
  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">🍽️ Daily Mess Feedback</h1>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm">
                  Welcome, <span className="font-semibold">{user.username}</span>
                  {user.role_name && (
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      user.role_name === 'admin' ? 'bg-red-500' : 'bg-green-500'
                    }`}>
                      {user.role_name}
                    </span>
                  )}
                </span>
                <button
                  onClick={onLogout}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
