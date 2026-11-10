import React from 'react';
import {
  Alert,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSettings } from '../context/SettingsContext';

const teamMembers = [
  {
    name: 'Shem Japheth Panes',
    role: 'Developer',
    image: require('../../assets/images/PANES.jpg'),
  },
  {
    name: 'Christian Jay Galceran',
    role: 'Developer',
    image: require('../../assets/images/GALCERAN.jpg'),
  },
  { name: 'Vanley John Monares', role: 'Developer' },
  { name: 'Shann Gee Caharían', role: 'Developer' },
  { name: 'Jandy Ombod', role: 'Developer' },
];

export default function AboutScreen() {
  const { theme } = useSettings();
  const isDark = theme === 'dark';

  const colors = {
    background: isDark ? '#101820' : '#F4F7FA',
    card: isDark ? '#1B2833' : '#FFFFFF',
    text: isDark ? '#F4F7FA' : '#172B3A',
    secondary: isDark ? '#B0BEC8' : '#647786',
    primary: '#006B45',
    border: isDark ? '#30414E' : '#E1E8ED',
  };

  async function openOfficialWebsite() {
    try {
      await Linking.openURL('https://www.ustp.edu.ph/');
    } catch (error) {
      console.error('Could not open official USTP website:', error);
      Alert.alert('Unable to open website', 'Please try again later.');
    }
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={23} color={colors.text} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          About USTP
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={46} color="#006B45" />
          </View>

          <Text style={styles.universityName}>
            UNIVERSITY OF SCIENCE AND TECHNOLOGY OF SOUTHERN PHILIPPINES
          </Text>

          <Text style={styles.campusLabel}>CAGAYAN DE ORO CAMPUS</Text>

          <Text style={styles.heroDescription}>
            Advancing science, technology, innovation, and education in
            Southern Philippines.
          </Text>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About the University
          </Text>

          <Text style={[styles.paragraph, { color: colors.secondary }]}>
            The University of Science and Technology of Southern Philippines
            (USTP) is a state university established on August 16, 2016,
            through Republic Act No. 10919. It was formed through the
            amalgamation of the Mindanao University of Science and Technology
            (MUST) in Cagayan de Oro City and the Misamis Oriental State
            College of Agriculture and Technology (MOSCAT) in Claveria,
            Misamis Oriental.
          </Text>

          <Text style={[styles.paragraph, { color: colors.secondary }]}>
            USTP is committed to providing advanced education, professional
            and technological instruction, research, and extension services
            that contribute to national development and global
            competitiveness.
          </Text>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            USTP Cagayan de Oro
          </Text>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={21} color={colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Location
              </Text>
              <Text style={[styles.infoDescription, { color: colors.secondary }]}>
                Cagayan de Oro City, Misamis Oriental, Philippines
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="library" size={21} color={colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Campus
              </Text>
              <Text style={[styles.infoDescription, { color: colors.secondary }]}>
                One of the major campuses of the USTP system
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="flask" size={21} color={colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Academic Focus
              </Text>
              <Text style={[styles.infoDescription, { color: colors.secondary }]}>
                Science, technology, engineering, mathematics, research,
                and innovation
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About Campus Navigator
          </Text>

          <Text style={[styles.paragraph, { color: colors.secondary }]}>
            USTP Campus Navigator is a campus navigation application designed
            to help students, faculty, staff, and visitors explore the USTP
            Cagayan de Oro campus.
          </Text>

          <Text style={[styles.paragraph, { color: colors.secondary }]}>
            The application provides campus location information, building
            details, saved places, and walking directions to make navigating
            around the campus easier and more convenient.
          </Text>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Development Team
          </Text>
          <Text style={[styles.teamSubtitle, { color: colors.secondary }]}>
            Team credits
          </Text>

          <View style={styles.teamList}>
            {teamMembers.map(member => {
              const initials = member.name
                .split(/\s+/)
                .slice(0, 2)
                .map(part => part[0]?.toUpperCase() ?? '')
                .join('');

              return (
                <View
                  key={member.name}
                  style={[
                    styles.teamMember,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  {member.image ? (
                    <Image
                      source={member.image}
                      style={styles.teamPhoto}
                      resizeMode="cover"
                      accessibilityLabel={`${member.name} profile photo`}
                    />
                  ) : (
                    <View
                      style={[
                        styles.teamInitials,
                        { backgroundColor: isDark ? '#263B35' : '#E5F3EC' },
                      ]}
                    >
                      <Text style={[styles.teamInitialsText, { color: colors.primary }]}>
                        {initials}
                      </Text>
                    </View>
                  )}

                  <View style={styles.teamMemberInfo}>
                    <Text style={[styles.teamMemberName, { color: colors.text }]}>
                      {member.name}
                    </Text>
                    <Text style={[styles.teamMemberRole, { color: colors.secondary }]}>
                      {member.role}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <Pressable
          style={styles.websiteButton}
          onPress={() => void openOfficialWebsite()}
          accessibilityRole="link"
          accessibilityLabel="Visit official USTP website"
        >
          <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
          <Text style={styles.websiteButtonText}>
            Visit Official USTP Website
          </Text>
          <Ionicons name="open-outline" size={18} color="#FFFFFF" />
        </Pressable>

        <Text style={[styles.footer, { color: colors.secondary }]}>
          USTP Campus Navigator
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 18,
    paddingBottom: 35,
    gap: 16,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  universityName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  campusLabel: {
    color: '#D8F3E6',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 10,
  },
  heroDescription: {
    color: '#E8F5EE',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 14,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 19,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  teamSubtitle: {
    fontSize: 13,
    marginTop: -7,
    marginBottom: 5,
  },
  teamList: {
    marginTop: 4,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  teamPhoto: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E1E8ED',
  },
  teamInitials: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamInitialsText: {
    fontSize: 17,
    fontWeight: '800',
  },
  teamMemberInfo: {
    flex: 1,
  },
  teamMemberName: {
    fontSize: 14,
    fontWeight: '700',
  },
  teamMemberRole: {
    fontSize: 12,
    marginTop: 4,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
    textAlign: 'left',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 13,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  infoDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  websiteButton: {
    minHeight: 52,
    backgroundColor: '#006B45',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  websiteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 2,
  },
});
