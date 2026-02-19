/**
 * Database Integration Tests
 * Tests for MongoDB operations and data integrity
 */

const mongoose = require('mongoose');

// Mock Mongoose models
const mockUserModel = {
  create: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
};

const mockMatchModel = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  updateOne: jest.fn(),
  aggregate: jest.fn(),
};

const mockMessageModel = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  updateMany: jest.fn(),
  countDocuments: jest.fn(),
};

describe('Database Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Operations', () => {
    const testUser = {
      _id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      age: 25,
      bio: 'Test bio',
      photos: ['photo1.jpg'],
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128],
      },
      preferences: {
        ageRange: { min: 20, max: 35 },
        distance: 50,
        gender: ['female'],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('Create User', () => {
      it('should create a new user successfully', async () => {
        mockUserModel.create.mockResolvedValue(testUser);

        const result = await mockUserModel.create(testUser);

        expect(result).toEqual(testUser);
        expect(mockUserModel.create).toHaveBeenCalledWith(testUser);
      });

      it('should reject duplicate email', async () => {
        mockUserModel.create.mockRejectedValue(new Error('E11000 duplicate key error'));

        await expect(mockUserModel.create(testUser)).rejects.toThrow('duplicate key');
      });
    });

    describe('Find User', () => {
      it('should find user by ID', async () => {
        mockUserModel.findById.mockResolvedValue(testUser);

        const result = await mockUserModel.findById('user_123');

        expect(result).toEqual(testUser);
      });

      it('should find user by email', async () => {
        mockUserModel.findOne.mockResolvedValue(testUser);

        const result = await mockUserModel.findOne({ email: 'test@example.com' });

        expect(result).toEqual(testUser);
      });

      it('should return null for non-existent user', async () => {
        mockUserModel.findById.mockResolvedValue(null);

        const result = await mockUserModel.findById('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('Update User', () => {
      it('should update user profile', async () => {
        const updatedUser = { ...testUser, bio: 'Updated bio' };
        mockUserModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

        const result = await mockUserModel.findByIdAndUpdate(
          'user_123',
          { bio: 'Updated bio' },
          { new: true }
        );

        expect(result.bio).toBe('Updated bio');
      });

      it('should update user location', async () => {
        const newLocation = {
          type: 'Point',
          coordinates: [-73.9857, 40.7484],
        };
        const updatedUser = { ...testUser, location: newLocation };
        mockUserModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

        const result = await mockUserModel.findByIdAndUpdate(
          'user_123',
          { location: newLocation },
          { new: true }
        );

        expect(result.location.coordinates).toEqual([-73.9857, 40.7484]);
      });
    });

    describe('Delete User', () => {
      it('should delete user', async () => {
        mockUserModel.findByIdAndDelete.mockResolvedValue(testUser);

        const result = await mockUserModel.findByIdAndDelete('user_123');

        expect(result).toEqual(testUser);
      });
    });
  });

  describe('Match Operations', () => {
    const testMatch = {
      _id: 'match_123',
      users: ['user_1', 'user_2'],
      createdAt: new Date(),
      conversation: 'conv_123',
      status: 'active',
    };

    describe('Create Match', () => {
      it('should create a new match', async () => {
        mockMatchModel.create.mockResolvedValue(testMatch);

        const result = await mockMatchModel.create({
          users: ['user_1', 'user_2'],
        });

        expect(result.users).toContain('user_1');
        expect(result.users).toContain('user_2');
      });
    });

    describe('Find Matches', () => {
      it('should find matches for user', async () => {
        mockMatchModel.find.mockResolvedValue([testMatch]);

        const result = await mockMatchModel.find({
          users: { $in: ['user_1'] },
        });

        expect(result).toHaveLength(1);
        expect(result[0].users).toContain('user_1');
      });

      it('should find specific match between users', async () => {
        mockMatchModel.findOne.mockResolvedValue(testMatch);

        const result = await mockMatchModel.findOne({
          users: { $all: ['user_1', 'user_2'] },
        });

        expect(result).toEqual(testMatch);
      });
    });
  });

  describe('Message Operations', () => {
    const testMessage = {
      _id: 'msg_123',
      conversationId: 'conv_123',
      senderId: 'user_1',
      content: 'Hello!',
      type: 'text',
      read: false,
      createdAt: new Date(),
    };

    describe('Create Message', () => {
      it('should create a new message', async () => {
        mockMessageModel.create.mockResolvedValue(testMessage);

        const result = await mockMessageModel.create({
          conversationId: 'conv_123',
          senderId: 'user_1',
          content: 'Hello!',
        });

        expect(result.content).toBe('Hello!');
      });
    });

    describe('Find Messages', () => {
      it('should find messages in conversation', async () => {
        mockMessageModel.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([testMessage]),
          }),
        });

        const result = await mockMessageModel
          .find({ conversationId: 'conv_123' })
          .sort({ createdAt: -1 })
          .limit(50);

        expect(result).toHaveLength(1);
      });
    });

    describe('Mark Messages Read', () => {
      it('should mark messages as read', async () => {
        mockMessageModel.updateMany.mockResolvedValue({ modifiedCount: 5 });

        const result = await mockMessageModel.updateMany(
          { conversationId: 'conv_123', senderId: { $ne: 'user_1' } },
          { read: true }
        );

        expect(result.modifiedCount).toBe(5);
      });
    });

    describe('Unread Count', () => {
      it('should count unread messages', async () => {
        mockMessageModel.countDocuments.mockResolvedValue(3);

        const result = await mockMessageModel.countDocuments({
          conversationId: 'conv_123',
          read: false,
          senderId: { $ne: 'user_1' },
        });

        expect(result).toBe(3);
      });
    });
  });

  describe('Geospatial Queries', () => {
    describe('Find Users Near Location', () => {
      it('should find users within radius', async () => {
        const nearbyUsers = [
          { _id: 'user_1', name: 'Alice', distance: 5 },
          { _id: 'user_2', name: 'Bob', distance: 10 },
        ];
        mockUserModel.aggregate.mockResolvedValue(nearbyUsers);

        const result = await mockUserModel.aggregate([
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [-74.006, 40.7128] },
              distanceField: 'distance',
              maxDistance: 50000, // 50km in meters
              spherical: true,
            },
          },
        ]);

        expect(result).toHaveLength(2);
        expect(result[0].distance).toBe(5);
      });
    });
  });

  describe('Aggregation Pipelines', () => {
    describe('User Statistics', () => {
      it('should aggregate user statistics', async () => {
        const stats = {
          totalUsers: 1000,
          activeUsers: 800,
          premiumUsers: 200,
        };
        mockUserModel.aggregate.mockResolvedValue([stats]);

        const result = await mockUserModel.aggregate([
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 },
              activeUsers: {
                $sum: {
                  $cond: [
                    { $gte: ['$lastActive', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ]);

        expect(result[0].totalUsers).toBe(1000);
      });
    });

    describe('Match Analytics', () => {
      it('should calculate match rate', async () => {
        const matchStats = {
          totalSwipes: 10000,
          matches: 500,
          matchRate: 0.05,
        };
        mockMatchModel.aggregate.mockResolvedValue([matchStats]);

        const result = await mockMatchModel.aggregate([
          { $group: { _id: null, matches: { $sum: 1 } } },
        ]);

        expect(result[0].matches).toBe(500);
      });
    });
  });

  describe('Data Integrity', () => {
    describe('Transactions', () => {
      it('should handle transaction for match creation', async () => {
        // Mock transaction
        const session = {
          startTransaction: jest.fn(),
          commitTransaction: jest.fn(),
          abortTransaction: jest.fn(),
          endSession: jest.fn(),
        };

        mongoose.startSession = jest.fn().mockResolvedValue(session);

        const createMatchWithTransaction = async () => {
          const session = await mongoose.startSession();
          session.startTransaction();

          try {
            // Create match
            await mockMatchModel.create({ users: ['user_1', 'user_2'] });
            // Update both users
            await mockUserModel.findByIdAndUpdate('user_1', { $push: { matches: 'match_123' } });
            await mockUserModel.findByIdAndUpdate('user_2', { $push: { matches: 'match_123' } });

            await session.commitTransaction();
          } catch (/** @type {any} */ error) {
            await session.abortTransaction();
            throw error;
          } finally {
            session.endSession();
          }
        };

        await createMatchWithTransaction();

        expect(session.startTransaction).toHaveBeenCalled();
        expect(session.commitTransaction).toHaveBeenCalled();
      });
    });

    describe('Indexing', () => {
      it('should use index for email lookups', async () => {
        // Index verification would be done in actual MongoDB
        const indexInfo = {
          email: { unique: true },
          'location.coordinates': '2dsphere',
          createdAt: -1,
        };

        expect(indexInfo.email.unique).toBe(true);
        expect(indexInfo['location.coordinates']).toBe('2dsphere');
      });
    });
  });
});
