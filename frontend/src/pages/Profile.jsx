import React from 'react';

function Profile() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="text-sm">👤</span>
        <span>Profile</span>
      </div>

      {/* Profile Container - Better proportions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden max-w-4xl">
        {/* Profile Header - Reduced height */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img 
                src="/api/placeholder/100/100" 
                alt="Profile" 
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
              />
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">David Johnson</h2>
              <p className="text-primary-100">Administrator</p>
              <p className="text-primary-200 text-sm">david@example.com</p>
            </div>
          </div>
        </div>

        {/* Profile Details - Better spacing */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Personal Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  Full Name
                </label>
                <span className="text-gray-900 dark:text-white font-medium">
                  David Johnson
                </span>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  Email Address
                </label>
                <span className="text-gray-900 dark:text-white font-medium">
                  david@example.com
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  Phone Number
                </label>
                <span className="text-gray-900 dark:text-white font-medium">
                  +1 234 567 8900
                </span>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  Department
                </label>
                <span className="text-gray-900 dark:text-white font-medium">
                  IT Administration
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Better spacing */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 flex-1 sm:flex-none">
              Edit Profile
            </button>
            <button className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200 flex-1 sm:flex-none">
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;




