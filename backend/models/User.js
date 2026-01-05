// ... (rest of your file stays the same) ...

// Create 2dsphere index on location for geospatial queries
userSchema.index({ location: '2dsphere' });

// Compound index for efficient discovery queries
userSchema.index({
  location: '2dsphere',
  gender: 1,
  age: 1,
  isActive: 1,
  isVerified: 1,
});

// TD-003: Indexes for retention queries
// FIX: Removed { name: 'createdAt_desc' } to avoid conflict with existing DB index
userSchema.index({ createdAt: -1 }); 

// Compound index for retention eligible users query
userSchema.index({ createdAt: 1, _id: 1 }, { name: 'createdAt_id_retention' });

// Virtual for profile completeness score
userSchema.virtual('profileCompleteness').get(function () {
  let score = 0;
  // ... (rest of function)
  if (this.name) score += 1;
  if (this.age) score += 1;
  if (this.gender) score += 1;
  if (this.bio) score += 1;
  if (this.photos && Array.isArray(this.photos) && this.photos.length > 0) score += 1;
  if (this.interests && Array.isArray(this.interests) && this.interests.length > 0) score += 1;
  if (this.location) score += 1;

  return Math.round((score / 7) * 100);
});

// ... (Rest of your methods: updateLocation, findNearby) ...

module.exports = mongoose.model('User', userSchema);
