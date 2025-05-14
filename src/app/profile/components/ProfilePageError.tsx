function ProfilePageError() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
        <p>Error loading profile. Please try again later.</p>
      </div>
    </div>
  )
}

export default ProfilePageError
