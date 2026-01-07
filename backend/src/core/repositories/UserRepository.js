const User = require('../domain/User');

class UserRepository {
  async findById(id, projection = null) {
    return User.findById(id, projection);
  }

  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  async findByIds(ids, projection = null) {
    return User.find({ _id: { $in: ids } }, projection);
  }

  async create(userData) {
    const user = new User(userData);
    return user.save();
  }

  async update(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async delete(id) {
    return User.findByIdAndDelete(id);
  }

  async findPotentialMatches(userId, filters = {}) {
    const { gender, minAge, maxAge, maxDistance, location, excludeIds = [] } = filters;
    
    const query = {
      _id: { $ne: userId, $nin: excludeIds },
      isActive: true,
      'photos.0': { $exists: true },
    };

    if (gender) query.gender = gender;
    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = minAge;
      if (maxAge) query.age.$lte = maxAge;
    }

    let queryBuilder = User.find(query);

    if (location && maxDistance) {
      queryBuilder = User.find({
        ...query,
        'location.coordinates': {
          $near: {
            $geometry: { type: 'Point', coordinates: location.coordinates },
            $maxDistance: maxDistance * 1000,
          },
        },
      });
    }

    return queryBuilder.select('-password -email').limit(50);
  }

  async updateLocation(userId, coordinates) {
    return User.findByIdAndUpdate(
      userId,
      {
        location: {
          type: 'Point',
          coordinates,
        },
        lastActive: new Date(),
      },
      { new: true }
    );
  }

  async updateLastActive(userId) {
    return User.findByIdAndUpdate(userId, { lastActive: new Date() });
  }

  async findNearby(coordinates, maxDistance, limit = 20) {
    return User.find({
      'location.coordinates': {
        $near: {
          $geometry: { type: 'Point', coordinates },
          $maxDistance: maxDistance * 1000,
        },
      },
      isActive: true,
    }).limit(limit);
  }
}

module.exports = new UserRepository();
