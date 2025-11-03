import React, { useState, FormEvent } from 'react';

interface BroadcastPasswordGateProps {
  onSuccess: () => void;
}

// TODO: For any production or private deployment, change this password.
const BROADCAST_PASSWORD = "bonerbots";

const BroadcastPasswordGate: React.FC<BroadcastPasswordGateProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === BROADCAST_PASSWORD) {
      setError('');
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="flex items-center justify-center pt-20">
      <div className="w-full max-w-sm p-8 space-y-6 bg-gray-800/50 rounded-lg shadow-lg border border-gray-700">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Broadcast Access</h2>
          <p className="mt-2 text-sm text-gray-400">
            Enter the password to access the broadcast dashboard.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
            >
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BroadcastPasswordGate;