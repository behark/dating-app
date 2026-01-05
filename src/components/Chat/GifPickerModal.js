import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import MediaMessagesService from '../../services/MediaMessagesService';
import logger from '../../utils/logger';

const { width } = Dimensions.get('window');
const GRID_COLS = 2;
const ITEM_SIZE = (width - 30) / GRID_COLS;

const GifPickerModal = ({ visible, onClose, onSelectGif, authToken }) => {
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const mediaService = new MediaMessagesService(authToken);

  const loadPopularGifs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await mediaService.getPopularGifs(20);
      setGifs(result.gifs || []);
    } catch (error) {
      logger.error('Error loading GIFs', error);
    } finally {
      setLoading(false);
    }
  }, [mediaService]);

  useEffect(() => {
    if (visible && gifs.length === 0) {
      loadPopularGifs();
    }
  }, [visible, gifs.length, loadPopularGifs]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPopularGifs();
      return;
    }

    setSearchLoading(true);
    try {
      const result = await mediaService.searchGifs(searchQuery, 20);
      setGifs(result.gifs || []);
    } catch (error) {
      logger.error('Error searching GIFs', error, { searchQuery });
    } finally {
      setSearchLoading(false);
    }
  };

  const renderGif = ({ item }) => (
    <TouchableOpacity
      style={styles.gifContainer}
      onPress={() => {
        onSelectGif(item);
        onClose();
      }}
    >
      <Image source={{ uri: item.url }} style={styles.gif} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      accessibilityLabel="GIF picker dialog"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={Colors.text.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose a GIF</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.text.tertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search GIFs..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                loadPopularGifs();
              }}
            >
              <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* GIFs Grid */}
        {loading || searchLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={gifs}
            renderItem={renderGif}
            keyExtractor={(item) => item.id}
            numColumns={GRID_COLS}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.lighter,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.dark,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background.light,
    borderRadius: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  gifContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.background.light,
    marginBottom: 8,
  },
  gif: {
    width: '100%',
    height: '100%',
  },
});

export default GifPickerModal;
